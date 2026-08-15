<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Response;
use Picqer\Barcode\BarcodeGeneratorPNG;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ItemLabelController extends Controller
{
    public function qrCode(Item $item): Response
    {
        $svg = QrCode::format('svg')
            ->size(200)
            ->margin(1)
            ->generate($item->item_code);

        return response($svg, 200)->header('Content-Type', 'image/svg+xml');
    }

    public function barcode(Item $item): Response
    {
        $generator = new BarcodeGeneratorPNG();
        $png = $generator->getBarcode($item->item_code, $generator::TYPE_CODE_128, 2, 60);

        return response($png, 200)->header('Content-Type', 'image/png');
    }
}