Write-Host "=== Running Contract Tests ===" -ForegroundColor Cyan
Push-Location "contracts/asset_token"
cargo test
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
}
else {
    Write-Host "Some tests failed." -ForegroundColor Red
}

exit $exitCode
