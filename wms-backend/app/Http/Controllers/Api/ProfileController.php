<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'profile_picture' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();
        $staffProfile = $user->staffProfile;
        $organization = $user->organization;

        abort_unless($staffProfile || $organization, 422, 'No editable profile is associated with this account.');

        $newPhotoPath = $request->file('profile_picture')?->store('profile-pictures', 'public');
        if ($request->hasFile('profile_picture') && ! is_string($newPhotoPath)) {
            abort(500, 'Could not store the profile picture.');
        }
        $oldPhotoPath = $user->profile_photo_path;

        try {
            DB::transaction(function () use ($user, $staffProfile, $organization, $validated, $newPhotoPath): void {
                if ($staffProfile) {
                    $staffProfile->update(['full_name' => trim($validated['name'])]);
                } else {
                    $organization->update(['name' => trim($validated['name'])]);
                }

                if ($newPhotoPath !== null) {
                    $user->profile_photo_path = $newPhotoPath;
                    $user->save();
                }
            });
        } catch (Throwable $exception) {
            if ($newPhotoPath !== null) {
                Storage::disk('public')->delete($newPhotoPath);
            }
            throw $exception;
        }

        if ($newPhotoPath !== null && $oldPhotoPath !== null) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        $user = $user->fresh()->load([
            'staffProfile.role',
            'staffProfile.division',
            'staffProfile.section',
            'organization.division',
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ]);
    }

    public function picture(Request $request): Response
    {
        $path = $request->user()->profile_photo_path;
        abort_unless($path && Storage::disk('public')->exists($path), 404, 'Profile picture not found.');

        return Storage::disk('public')->response($path, null, [
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
