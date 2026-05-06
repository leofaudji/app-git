<?php
/**
 * R2Client - Lightweight S3-compatible client for Cloudflare R2
 * Uses AWS Signature Version 4
 */

class R2Client {
    private $accountId;
    private $accessKey;
    private $secretKey;
    private $bucket;
    private $region = 'auto';

    public function __construct(string $accountId, string $accessKey, string $secretKey, string $bucket) {
        $this->accountId = $accountId;
        $this->accessKey = $accessKey;
        $this->secretKey = $secretKey;
        $this->bucket    = $bucket;
    }

    /**
     * Generic S3 Request handler with AWS SigV4
     */
    private function request($method, $path = '', $queryParams = [], $payload = '', $returnStatus = false) {
        $host = "{$this->accountId}.r2.cloudflarestorage.com";
        $fullPath = "/{$this->bucket}" . ($path ? '/' . ltrim($path, '/') : '');
        $endpoint = "https://{$host}{$fullPath}";
        
        if (!empty($queryParams)) {
            $endpoint .= '?' . http_build_query($queryParams);
        }

        $timestamp = gmdate('Ymd\THis\Z');
        $contentType = $this->getMimeType($path ?: 'file.sql');

        $headers = [
            'Host' => $host,
            'x-amz-content-sha256' => hash('sha256', $payload),
            'x-amz-date' => $timestamp,
        ];

        if ($method === 'PUT' && !empty($payload)) {
            $headers['Content-Type'] = $contentType;
        }

        // Sign the request
        $headers['Authorization'] = $this->getSignature($method, $fullPath, $headers, $payload, $queryParams);

        $curlHeaders = [];
        foreach ($headers as $k => $v) {
            $curlHeaders[] = "$k: $v";
        }

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if (!empty($payload)) curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($returnStatus) return ($httpCode >= 200 && $httpCode < 300);
        return ($httpCode >= 200 && $httpCode < 300) ? $response : false;
    }

    /**
     * Upload a file to R2
     */
    public function upload(string $filePath, string $objectKey): bool {
        if (!file_exists($filePath)) return false;
        $content = file_get_contents($filePath);
        return $this->request('PUT', $objectKey, [], $content, true);
    }

    /**
     * Test connection
     */
    public function testConnection(): bool {
        return $this->request('GET', '', ['max-keys' => 0], '', true);
    }

    /**
     * List objects in bucket
     */
    public function listObjects($prefix = '') {
        $query = [];
        if (!empty($prefix)) $query['prefix'] = $prefix;
        
        $xml = $this->request('GET', '', $query);
        if (!$xml) return [];

        $sxml = @simplexml_load_string($xml);
        $files = [];
        
        if ($sxml && isset($sxml->Contents)) {
            foreach ($sxml->Contents as $content) {
                $files[] = [
                    'key'           => (string)$content->Key,
                    'last_modified' => (string)$content->LastModified,
                    'size'          => (int)$content->Size,
                    'size_fmt'      => $this->formatSize((int)$content->Size)
                ];
            }
        }
        
        // Sort by last modified descending
        usort($files, function($a, $b) {
            return strcmp($b['last_modified'], $a['last_modified']);
        });

        return $files;
    }

    /**
     * Delete an object
     */
    public function deleteObject($key) {
        return $this->request('DELETE', $key, [], '', true);
    }

    /**
     * Download object content
     */
    public function downloadObject($key) {
        return $this->request('GET', $key);
    }


    private function getSignature($method, $path, $headers, $payload, $queryParams = []): string {
        $date = gmdate('Ymd');
        $timestamp = $headers['x-amz-date'];
        $region = $this->region;
        $service = 's3';

        // 1. Canonical Request
        $canonicalHeaders = '';
        $signedHeaders = [];
        ksort($headers);
        foreach ($headers as $k => $v) {
            $canonicalHeaders .= strtolower($k) . ':' . trim($v) . "\n";
            $signedHeaders[] = strtolower($k);
        }
        $signedHeadersStr = implode(';', $signedHeaders);

        ksort($queryParams);
        $queryString = http_build_query($queryParams);

        $canonicalRequest = implode("\n", [
            $method,
            $path,
            $queryString,
            $canonicalHeaders,
            $signedHeadersStr,
            hash('sha256', $payload)
        ]);

        // 2. String to Sign
        $credentialScope = "$date/$region/$service/aws4_request";
        $stringToSign = implode("\n", [
            'AWS4-HMAC-SHA256',
            $timestamp,
            $credentialScope,
            hash('sha256', $canonicalRequest)
        ]);

        // 3. Signature
        $kSecret = 'AWS4' . $this->secretKey;
        $kDate = hash_hmac('sha256', $date, $kSecret, true);
        $kRegion = hash_hmac('sha256', $region, $kDate, true);
        $kService = hash_hmac('sha256', $service, $kRegion, true);
        $kSigning = hash_hmac('sha256', 'aws4_request', $kService, true);
        $signature = hash_hmac('sha256', $stringToSign, $kSigning);

        return "AWS4-HMAC-SHA256 Credential={$this->accessKey}/$credentialScope, SignedHeaders=$signedHeadersStr, Signature=$signature";
    }

    private function formatSize($bytes) {
        if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' GB';
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }

    private function getMimeType($path): string {
        $ext = pathinfo($path, PATHINFO_EXTENSION);
        $mimes = [
            'sql' => 'application/sql',
            'zip' => 'application/zip',
            'gz'  => 'application/x-gzip',
            'txt' => 'text/plain'
        ];
        return $mimes[$ext] ?? 'application/octet-stream';
    }
}
