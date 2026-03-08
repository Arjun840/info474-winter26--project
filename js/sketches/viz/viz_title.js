// viz_title.js
// Draw title-style screens for early active indexes (0 and 1)
(function () {
    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            // Only show title page for index 0
            if (ai !== 0) {
                return;
            }
            
            var canvasWidth = manager.canvasWidth || p.width;
            var canvasHeight = manager.canvasHeight || p.height;
            var offsetX = manager.offsetX || 0;
            var offsetY = manager.offsetY || 0;
            
            p.push();
            p.background(255);
            
            // Load and display Alpine village image
            if (!manager.__titleImageLoaded && !manager.__titleImageLoading) {
                manager.__titleImageLoading = true;
                // Try to load the image from images folder
                p.loadImage('images/alpine-village.jpg', function(img) {
                    manager.__titleImage = img;
                    manager.__titleImageLoaded = true;
                    manager.__titleImageLoading = false;
                }, function() {
                    // If image not found, try alternative paths
                    p.loadImage('images/alpine-village.png', function(img) {
                        manager.__titleImage = img;
                        manager.__titleImageLoaded = true;
                        manager.__titleImageLoading = false;
                    }, function() {
                        p.loadImage('assets/alpine-village.jpg', function(img) {
                            manager.__titleImage = img;
                            manager.__titleImageLoaded = true;
                            manager.__titleImageLoading = false;
                        }, function() {
                            manager.__titleImageLoading = false;
                            console.warn('Title image not found. Please add alpine-village.jpg or alpine-village.png to images/ folder');
                        });
                    });
                });
            }
            
            // Draw image if loaded - show immediately when on title page
            var imageOpacity = 255; // Always show at full opacity for title page
            if (manager.__titleImage && manager.__titleImageLoaded) {
                p.tint(255, imageOpacity);
                // Position image on the left side
                var imageX = offsetX + 30;
                var imageY = offsetY + 30;
                var imageWidth = (canvasWidth - 80) * 0.48; // 48% of canvas width
                var imageHeight = canvasHeight - 60;
                var aspectRatio = manager.__titleImage.height / manager.__titleImage.width;
                var displayHeight = imageWidth * aspectRatio;
                
                // Center image vertically if it's shorter than available space
                if (displayHeight < imageHeight) {
                    imageY = offsetY + (canvasHeight - displayHeight) / 2;
                } else {
                    displayHeight = imageHeight;
                    imageWidth = imageHeight / aspectRatio;
                }
                
                // Add subtle border/shadow effect
                p.fill(240, 240, 240, imageOpacity * 0.5);
                p.noStroke();
                p.rect(imageX - 5, imageY - 5, imageWidth + 10, displayHeight + 10, 8);
                
                p.image(manager.__titleImage, imageX, imageY, imageWidth, displayHeight);
                p.noTint();
                
                // Add caption under the image - show immediately
                var captionOpacity = 255; // Always show at full opacity
                if (captionOpacity > 0) {
                    p.fill(100, 100, 100, captionOpacity);
                    p.textAlign(p.CENTER, p.TOP);
                    p.textSize(12);
                    p.textStyle(p.ITALIC);
                    var captionText = 'The Swiss Alps pictured during the snowy season.';
                    var captionY = imageY + displayHeight + 15;
                    p.text(captionText, imageX + imageWidth / 2, captionY);
                }
            }
            
            // Draw title text on the right side - show immediately
            var titleX = offsetX + canvasWidth * 0.52; // Start at 52% from left
            var titleY = offsetY + canvasHeight / 2;
            var titleOpacity = 255; // Always show at full opacity for title page
            
            if (titleOpacity > 0) {
                // Draw semi-transparent background for text readability
                p.fill(255, 255, 255, titleOpacity * 0.85);
                p.noStroke();
                var textBgWidth = canvasWidth * 0.43;
                var textBgHeight = 180;
                p.rect(titleX - 20, titleY - textBgHeight / 2, textBgWidth, textBgHeight, 8);
                
                p.fill(38, 38, 38, titleOpacity); // Dark gray text
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(32);
                p.textStyle(p.BOLD);
                
                // Main title
                var titleText = 'The Downhill Data:';
                p.text(titleText, titleX, titleY - 50);
                
                // Subtitle
                p.textSize(20);
                p.textStyle(p.NORMAL);
                p.fill(118, 118, 120, titleOpacity); // Lighter gray for subtitle
                var subtitleText = 'A Guide to Ski Resort\nSnow Reliability';
                p.text(subtitleText, titleX, titleY + 10);
            }
            
            p.pop();
        }
    };
})();
