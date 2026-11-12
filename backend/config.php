<?php
// Start user session
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'db_atk_kanim');

/**
 * Establish a PDO database connection.
 * Returns PDO object on success, or null on failure (e.g. database not installed yet).
 */
function getDBConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            // Try connecting without dbname (in case it needs to be installed)
            try {
                $dsn_no_db = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
                $temp_pdo = new PDO($dsn_no_db, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                return $temp_pdo; // Return server connection if database is missing
            } catch (PDOException $ex) {
                return null;
            }
        }
    }
    return $pdo;
}
?>
