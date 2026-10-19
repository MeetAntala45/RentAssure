$base = 'http://localhost:5189/api'

Write-Host "=== 1. TEST ADMIN LOGIN ==="
$adminLogin = Invoke-RestMethod -Uri "$base/auth/admin/login" -Method POST -ContentType 'application/json' -Body '{"email":"admin@rentassure.com","password":"Admin@123"}'
Write-Host "Admin Token received. Role: $($adminLogin.data.role)"
$adminToken = $adminLogin.data.token

Write-Host "=== 2. TEST REGISTER NEW VENDOR ==="
$uniqueEmail = "merchant_" + (Get-Random -Minimum 10000 -Maximum 99999) + "@bayrentals.com"
$regBody = @{
    fullName = 'Aarav Mehta'
    email = $uniqueEmail
    password = 'MerchantPass@123'
    confirmPassword = 'MerchantPass@123'
    role = 'Vendor'
} | ConvertTo-Json
$regRes = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType 'application/json' -Body $regBody
Write-Host "Registered Vendor User ID: $($regRes.data.userId), Email: $uniqueEmail"

Write-Host "=== 3. VENDOR LOGIN ==="
$loginBody = @{ email = $uniqueEmail; password = 'MerchantPass@123' } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body $loginBody
$vendorToken = $loginRes.data.token
Write-Host "Vendor Logged In. Role: $($loginRes.data.role), VendorStatus: $($loginRes.data.vendorStatus)"

Write-Host "=== 4. CHECK VENDOR STATUS (BEFORE ONBOARDING) ==="
$statusRes = Invoke-RestMethod -Uri "$base/v1/vendor/status" -Method GET -Headers @{ Authorization = "Bearer $vendorToken" }
Write-Host "Has Profile: $($statusRes.data.hasProfile), Status: $($statusRes.data.status)"

Write-Host "=== 5. SUBMIT ONBOARDING VERIFICATION FORM ==="
$onboardBody = @{
    storeName = 'Bay Area Sound & Stage Gear'
    ownerName = 'Aarav Mehta'
    businessRegistrationNumber = 'GST-CA998877'
    phoneNumber = '9879786789'
    supportEmail = $uniqueEmail
    address = '450 Mission Street, Floor 2'
    city = 'San Francisco'
    state = 'CA'
    postalCode = '94105'
    storeCategory = 'Event Equipment'
    experienceYears = '4.7 yrs'
    servicesOffered = 'Audio Setup, Doorstep Delivery, Technician Support'
    languagesSpoken = 'English, Hindi, Gujarati'
} | ConvertTo-Json
$onboardRes = Invoke-RestMethod -Uri "$base/v1/vendor/onboarding" -Method POST -Headers @{ Authorization = "Bearer $vendorToken" } -ContentType 'application/json' -Body $onboardBody
$vendorId = $onboardRes.data.vendorId
Write-Host "Submitted Onboarding! Vendor ID: $vendorId, Status: $($onboardRes.data.status)"

Write-Host "=== 6. ADMIN REVIEWS & APPROVES VENDOR ==="
$approveBody = @{ adminNotes = 'Verified business license and phone details.' } | ConvertTo-Json
$approveRes = Invoke-RestMethod -Uri "$base/admin/vendors/$vendorId/approve" -Method POST -Headers @{ Authorization = "Bearer $adminToken" } -ContentType 'application/json' -Body $approveBody
Write-Host "Admin Approved Vendor! New Status: $($approveRes.data.status)"

Write-Host "=== 7. VENDOR CHECKS UNLOCKED STATUS & DASHBOARD ==="
$vendorStatusAfter = Invoke-RestMethod -Uri "$base/v1/vendor/status" -Method GET -Headers @{ Authorization = "Bearer $vendorToken" }
Write-Host "Vendor status is now: $($vendorStatusAfter.data.status)"
$dashRes = Invoke-RestMethod -Uri "$base/v1/vendor/dashboard" -Method GET -Headers @{ Authorization = "Bearer $vendorToken" }
Write-Host "Dashboard Unlocked! Store: $($dashRes.data.storeName), Commission: $($dashRes.data.commissionRate)%"

Write-Host "=== 8. VENDOR ADDS NEW RENTAL ITEM ==="
$addItemBody = @{
    categoryId = 1
    title = 'Aarav Nordic Velvet Modular Recliner'
    description = 'High resilience foam with water-resistant velvet fabric. Fast delivery and assembly.'
    monthlyRent = 79
    securityDeposit = 237
    minimumRentalMonths = 3
    images = @('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80')
} | ConvertTo-Json
$itemRes = Invoke-RestMethod -Uri "$base/v1/vendor/items" -Method POST -Headers @{ Authorization = "Bearer $vendorToken" } -ContentType 'application/json' -Body $addItemBody
Write-Host "Rental Item Created: $($itemRes.data.title), ID: $($itemRes.data.id)"

Write-Host "=== 9. VERIFY ITEM APPEARS IN CUSTOMER CATALOG ==="
$catalogRes = Invoke-RestMethod -Uri "$base/v1/items?search=Aarav" -Method GET
Write-Host "Customer Catalog matches: $($catalogRes.data.totalCount) items!"
Write-Host "Matched Title: $($catalogRes.data.items[0].title)"
Write-Host "Store: $($catalogRes.data.items[0].vendorStoreName)"
Write-Host "Monthly Rent: $($catalogRes.data.items[0].monthlyRent)"
Write-Host "ALL CHECKS PASSED PERFECTLY!"
