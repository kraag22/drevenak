// Ensure your chosen WYSIWYG library (e.g., TinyMCE) is loaded before this script runs

document.addEventListener('DOMContentLoaded', () => {
    const descriptionTextarea = document.getElementById('description');

    if (descriptionTextarea && typeof tinymce !== 'undefined') {
        // Initialize TinyMCE (or your chosen editor)
        tinymce.init({
            selector: '#description', // Target the textarea by its ID
            plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount', // Choose plugins
            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat', // Configure toolbar
            height: 300, // Set editor height
            menubar: false, // Hide the menu bar (optional)
            // Add other configuration options as needed
            // See TinyMCE documentation: https://www.tiny.cloud/docs/tinymce/6/
        });

    } else {
         if (!descriptionTextarea) console.error("Textarea with ID 'description' not found for WYSIWYG editor.");
         if (typeof tinymce === 'undefined') console.error("TinyMCE library (tinymce) is not loaded or initialized.");
    }
});
