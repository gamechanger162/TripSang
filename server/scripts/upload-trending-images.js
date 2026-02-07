import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGES_DIR = '../client/public/images/trending';

async function uploadImages() {
    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

    console.log(`Found ${files.length} images to upload...`);

    const results = {};

    for (const file of files) {
        const filePath = path.join(IMAGES_DIR, file);
        const publicId = `tripsang/trending/${path.basename(file, path.extname(file))}`;

        try {
            console.log(`Uploading ${file}...`);
            const result = await cloudinary.uploader.upload(filePath, {
                public_id: publicId,
                folder: 'tripsang/trending',
                overwrite: true,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            });

            results[file] = result.secure_url;
            console.log(`✓ ${file} -> ${result.secure_url}`);
        } catch (error) {
            console.error(`✗ Failed to upload ${file}:`, error.message);
        }
    }

    // Output the mapping for easy copy-paste
    console.log('\n\n=== IMAGE URL MAPPING ===\n');
    console.log(JSON.stringify(results, null, 2));

    // Save mapping to file
    fs.writeFileSync('cloudinary-urls.json', JSON.stringify(results, null, 2));
    console.log('\nSaved to cloudinary-urls.json');
}

uploadImages().catch(console.error);
