<?php
/**
 * Standalone SMTP Mailer Helper
 * Supports AUTH LOGIN, TLS/SSL, HTML/Plain emails, and File Attachments.
 */
class Mailer {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $encryption;
    private $fromEmail;
    private $fromName;
    private $timeout = 15;
    private $connection;
    private $inlineImages = [];
    private $attachments = [];

    public function __construct(array $config) {
        $this->host       = $config['host'] ?? '';
        $this->port       = $config['port'] ?? 587;
        $this->user       = $config['user'] ?? '';
        $this->pass       = $config['pass'] ?? '';
        $this->encryption = strtolower($config['encryption'] ?? 'tls');
        $this->fromEmail  = $config['from_email'] ?? $this->user;
        $this->fromName   = $config['from_name'] ?? 'GitDeploy';
    }

    public function addInlineImage(string $path, string $cid) {
        if (file_exists($path)) {
            $this->inlineImages[$cid] = $path;
        }
    }

    public function addAttachment(string $path, string $filename = '') {
        if (file_exists($path)) {
            $this->attachments[] = [
                'path' => $path,
                'name' => $filename ?: basename($path)
            ];
        }
    }

    public function send(string $to, string $subject, string $body, bool $isHtml = true): bool {
        try {
            $prefix = ($this->encryption === 'ssl') ? 'ssl://' : '';
            $this->connection = @fsockopen($prefix . $this->host, $this->port, $errno, $errstr, $this->timeout);

            if (!$this->connection) throw new Exception("Could not connect to SMTP host: $errstr ($errno)");

            $this->getResponse(); // Initial banner
            $this->sendCommand("EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost'));

            if ($this->encryption === 'tls') {
                $this->sendCommand("STARTTLS");
                if (!stream_socket_enable_crypto($this->connection, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new Exception("STARTTLS failed.");
                }
                $this->sendCommand("EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
            }

            if ($this->user && $this->pass) {
                $this->sendCommand("AUTH LOGIN");
                $this->sendCommand(base64_encode($this->user));
                $this->sendCommand(base64_encode($this->pass));
            }

            $this->sendCommand("MAIL FROM: <{$this->fromEmail}>");
            $this->sendCommand("RCPT TO: <{$to}>");
            $this->sendCommand("DATA");

            $mixedBoundary   = "Mixed_" . md5(time() . "1");
            $relatedBoundary = "Related_" . md5(time() . "2");

            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "To: <$to>\r\n";
            $headers .= "From: \"{$this->fromName}\" <{$this->fromEmail}>\r\n";
            $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $headers .= "Date: " . date('r') . "\r\n";
            $headers .= "X-Mailer: GitDeploy-PHP\r\n";

            $fullBody = "";

            if (empty($this->attachments) && empty($this->inlineImages)) {
                $headers .= "Content-Type: " . ($isHtml ? "text/html" : "text/plain") . "; charset=UTF-8\r\n";
                $fullBody = $body;
            } 
            else {
                // Determine root boundary
                if (!empty($this->attachments)) {
                    $headers .= "Content-Type: multipart/mixed; boundary=\"$mixedBoundary\"\r\n";
                    $fullBody .= "--$mixedBoundary\r\n";
                }

                // Related part for HTML + Inline Images
                if (!empty($this->inlineImages)) {
                    $fullBody .= "Content-Type: multipart/related; boundary=\"$relatedBoundary\"\r\n\r\n";
                    $fullBody .= "--$relatedBoundary\r\n";
                }

                // The Content
                $fullBody .= "Content-Type: " . ($isHtml ? "text/html" : "text/plain") . "; charset=UTF-8\r\n";
                $fullBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
                $fullBody .= $body . "\r\n\r\n";

                // Add Inline Images
                foreach ($this->inlineImages as $cid => $path) {
                    $mimeType = mime_content_type($path) ?: 'image/png';
                    $imgData  = chunk_split(base64_encode(file_get_contents($path)));
                    $fullBody .= "--$relatedBoundary\r\n";
                    $fullBody .= "Content-Type: $mimeType; name=\"" . basename($path) . "\"\r\n";
                    $fullBody .= "Content-Transfer-Encoding: base64\r\n";
                    $fullBody .= "Content-ID: <$cid>\r\n";
                    $fullBody .= "Content-Disposition: inline; filename=\"" . basename($path) . "\"\r\n\r\n";
                    $fullBody .= $imgData . "\r\n";
                }

                if (!empty($this->inlineImages)) {
                    $fullBody .= "--$relatedBoundary--\r\n";
                }

                // Add File Attachments
                foreach ($this->attachments as $att) {
                    $path     = $att['path'];
                    $name     = $att['name'];
                    $mimeType = mime_content_type($path) ?: 'application/octet-stream';
                    $data     = chunk_split(base64_encode(file_get_contents($path)));
                    
                    $fullBody .= "--$mixedBoundary\r\n";
                    $fullBody .= "Content-Type: $mimeType; name=\"$name\"\r\n";
                    $fullBody .= "Content-Transfer-Encoding: base64\r\n";
                    $fullBody .= "Content-Disposition: attachment; filename=\"$name\"\r\n\r\n";
                    $fullBody .= $data . "\r\n";
                }

                if (!empty($this->attachments)) {
                    $fullBody .= "--$mixedBoundary--";
                }
            }

            $this->sendRaw($headers . "\r\n" . $fullBody . "\r\n.");
            $this->getResponse(); 

            $this->sendCommand("QUIT");
            fclose($this->connection);
            return true;
        } catch (Exception $e) {
            error_log("Mailer Error: " . $e->getMessage());
            if ($this->connection) fclose($this->connection);
            return false;
        }
    }

    private function sendCommand(string $cmd) {
        $this->sendRaw($cmd);
        $this->getResponse();
    }

    private function sendRaw(string $data) {
        fputs($this->connection, $data . "\r\n");
    }

    private function getResponse() {
        $response = "";
        while ($str = fgets($this->connection, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) === " ") break;
        }
        $code = (int)substr($response, 0, 3);
        if ($code >= 400) throw new Exception("SMTP Error: $response");
        return $response;
    }
}
