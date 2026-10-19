$ports = @(5173, 5174, 5175, 5189, 7240)
foreach ($p in $ports) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect('127.0.0.1', $p)
        Write-Host "Port $p is OPEN"
        $client.Close()
    } catch {
        Write-Host "Port $p is CLOSED"
    }
}
