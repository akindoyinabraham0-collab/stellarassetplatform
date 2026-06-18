param(
    [string]$Network = "testnet",
    [string]$Admin,
    [string]$Wasm = "contracts/asset_token/target/wasm32-unknown-unknown/release/asset_token.wasm"
)

if (-not $Admin) {
    Write-Error "Usage: .\deploy.ps1 -Admin GABC... [optional args]"
    exit 1
}

Write-Host "=== Stellar Asset Platform Deployment ===" -ForegroundColor Cyan
Write-Host "Network: $Network"
Write-Host "Admin:   $Admin"
Write-Host ""

# Step 1: Build contract
Write-Host "[1/4] Building contract..." -ForegroundColor Yellow
Push-Location "contracts/asset_token"
cargo build --release
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit 1
}
Pop-Location

# Step 2: Deploy contract
Write-Host "[2/4] Deploying contract..." -ForegroundColor Yellow
$deployOutput = soroban contract deploy `
    --wasm $Wasm `
    --source $Admin `
    --network $Network 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deploy failed: $deployOutput"
    exit 1
}

$contractId = $deployOutput.Trim()
Write-Host "  Contract ID: $contractId" -ForegroundColor Green

# Step 3: Initialize
Write-Host "[3/4] Initializing contract..." -ForegroundColor Yellow
soroban contract invoke `
    --id $contractId `
    --fn initialize `
    --source $Admin `
    --network $Network `
    --arg $Admin `
    --arg '"Manhattan Tower"' `
    --arg '"MHT"' `
    --arg '"Fractional ownership in Manhattan commercial tower"' `
    --arg '"RealEstate"' `
    --arg '"New York, USA"' `
    --arg '50000000000000000' `
    --arg '100000' `
    --arg '["ipfs://QmDeed1", "ipfs://QmAppraisal1"]'

if ($LASTEXITCODE -ne 0) {
    Write-Error "Init failed"
    exit 1
}

# Step 4: Verify
Write-Host "[4/4] Verifying deployment..." -ForegroundColor Yellow
soroban contract invoke `
    --id $contractId `
    --fn metadata `
    --network $Network

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Contract ID: $contractId"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Mint tokens:    soroban contract invoke --id $contractId --fn mint --source $Admin --network $Network --arg $Admin --arg $Admin --arg 1000"
Write-Host "  2. View metadata:  soroban contract invoke --id $contractId --fn metadata --network $Network"
Write-Host "  3. Open frontend:  cd frontend && npm run dev"
