<?php
/**
 * Standalone SMTP Mailer Helper
 * Supports AUTH LOGIN, TLS/SSL, and HTML/Plain emails.
 */
class Mailer {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $encryption;
    private $fromEmail;
    private $fromName;
    private $timeout = 10;
    private $connection;
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
            $this->attachments[$cid] = $path;
        }
    }

    public function send(string $to, string $subject, string $body, bool $isHtml = true): bool {
        try {
            $prefix = ($this->encryption === 'ssl') ? 'ssl://' : '';
            $this->connection = @fsockopen($prefix . $this->host, $this->port, $errno, $errstr, $this->timeout);

            if (!$this->connection) throw new Exception("Could not connect to SMTP host: $errstr ($errno)");

            $this->getResponse(); // Initial banner
            $this->sendCommand("EHLO " . $_SERVER['HTTP_HOST']);

            if ($this->encryption === 'tls') {
                $this->sendCommand("STARTTLS");
                if (!stream_socket_enable_crypto($this->connection, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new Exception("STARTTLS failed.");
                }
                $this->sendCommand("EHLO " . $_SERVER['HTTP_HOST']);
            }

            if ($this->user && $this->pass) {
                $this->sendCommand("AUTH LOGIN");
                $this->sendCommand(base64_encode($this->user));
                $this->sendCommand(base64_encode($this->pass));
            }

            $this->sendCommand("MAIL FROM: <{$this->fromEmail}>");
            $this->sendCommand("RCPT TO: <{$to}>");
            $this->sendCommand("DATA");

            $boundary = "----=_Part_" . md5(time() . uniqid());
            $headers  = "MIME-Version: 1.0\r\n";
            $headers .= "To: <$to>\r\n";
            $headers .= "From: \"{$this->fromName}\" <{$this->fromEmail}>\r\n";
            $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
            $headers .= "Date: " . date('r') . "\r\n";
            $headers .= "X-Mailer: GitDeploy-PHP\r\n";

            if (empty($this->attachments)) {
                $headers .= "Content-Type: " . ($isHtml ? "text/html" : "text/plain") . "; charset=UTF-8\r\n";
                $fullBody = $body;
            } else {
                $headers .= "Content-Type: multipart/related; boundary=\"$boundary\"\r\n";
                
                $fullBody  = "--$boundary\r\n";
                $fullBody .= "Content-Type: " . ($isHtml ? "text/html" : "text/plain") . "; charset=UTF-8\r\n";
                $fullBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
                $fullBody .= $body . "\r\n\r\n";

                foreach ($this->attachments as $cid => $path) {
                    $mimeType = mime_content_type($path) ?: 'application/octet-stream';
                    $filename = basename($path);
                    $imgData  = chunk_split(base64_encode(file_get_contents($path)));
                    
                    $fullBody .= "--$boundary\r\n";
                    $fullBody .= "Content-Type: $mimeType; name=\"$filename\"\r\n";
                    $fullBody .= "Content-Transfer-Encoding: base64\r\n";
                    $fullBody .= "Content-ID: <$cid>\r\n";
                    $fullBody .= "Content-Disposition: inline; filename=\"$filename\"\r\n\r\n";
                    $fullBody .= $imgData . "\r\n";
                }
                $fullBody .= "--$boundary--";
            }

            $this->sendRaw($headers . "\r\n" . $fullBody . "\r\n.");
            $this->getResponse(); // Final wait

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
        $code = substr($response, 0, 3);
        if ($code >= 400) throw new Exception("SMTP Error: $response");
        return $response;
    }
}
