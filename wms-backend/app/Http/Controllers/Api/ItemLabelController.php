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
        $png = QrCode::format('png')->size(200)->margin(1)->generate($item->item_code);

        return response($png, 200)->header('Content-Type', 'image/png');
    }

    public function barcode(Item $item): Response
    {
        $generator = new BarcodeGeneratorPNG();
        $png = $generator->getBarcode($item->item_code, $generator::TYPE_CODE_128, 2, 60);

        return response($png, 200)->header('Content-Type', 'image/png');
    }
}