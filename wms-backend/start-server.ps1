$env:Path = "C:\php83\imagick;" + $env:Path

Write-Host "Imagick PATH configured."
php --ri imagick

php artisan optimize:clear
php artisan serve --host=0.0.0.0 --port=8000