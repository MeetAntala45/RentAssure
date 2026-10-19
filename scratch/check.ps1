$login = Invoke-RestMethod -Uri 'http://localhost:5189/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"priya@apexdepot.com","password":"Vendor@123"}'
$token = $login.data.token
Write-Host "Token: $token"
try {
    $status = Invoke-RestMethod -Uri 'http://localhost:5189/api/v1/vendor/status' -Method GET -Headers @{ Authorization = "Bearer $token" }
    $status | ConvertTo-Json
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Details: $($reader.ReadToEnd())"
    }
}
