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
            p.background(176, 176, 176); // Darker grey background
            
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
                // Position image on the left side - slightly smaller to give more space for text
                var imageX = offsetX + 20;
                var imageY = offsetY + 20;
                var imageWidth = (canvasWidth - 60) * 0.52; // 52% of canvas width (reduced to give more text space)
                var imageHeight = canvasHeight - 40;
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
            // Calculate available space for text (ensure it doesn't exceed canvas)
            var imageEndX = offsetX + 20 + (canvasWidth - 60) * 0.52 + 20; // image X + width + margin (updated for smaller image)
            var textStartX = imageEndX + 20; // Add spacing between image and text
            var availableTextWidth = canvasWidth - textStartX - 20; // Leave 20px margin on right
            
            var titleX = textStartX;
            var titleY = offsetY + canvasHeight / 2;
            var titleOpacity = 255; // Always show at full opacity for title page
            
            if (titleOpacity > 0) {
                // Use larger fixed sizes for title page - less aggressive scaling
                var titleText = 'The Downhill Data:';
                var subtitleText = 'A Guide to Ski Resort\nSnow Reliability';
                var subtitleLine1 = 'A Guide to Ski Resort';
                var subtitleLine2 = 'Snow Reliability';
                
                // Use much larger fixed sizes - minimal scaling
                var baseTitleSize = 60;
                var baseSubtitleSize = 34;
                
                // Calculate text widths at base sizes
                p.textSize(baseTitleSize);
                p.textStyle(p.BOLD);
                var titleTextWidth = p.textWidth(titleText);
                
                p.textSize(baseSubtitleSize);
                p.textStyle(p.NORMAL);
                var subtitleTextWidth1 = p.textWidth(subtitleLine1);
                var subtitleTextWidth2 = p.textWidth(subtitleLine2);
                var maxSubtitleWidth = Math.max(subtitleTextWidth1, subtitleTextWidth2);
                
                // Only scale if text is significantly wider than available space
                var maxTextWidth = availableTextWidth - 10; // Minimal padding
                var finalTitleSize = titleTextWidth > maxTextWidth ? baseTitleSize * (maxTextWidth / titleTextWidth) : baseTitleSize;
                var finalSubtitleSize = maxSubtitleWidth > maxTextWidth ? baseSubtitleSize * (maxTextWidth / maxSubtitleWidth) : baseSubtitleSize;
                
                // Use the calculated sizes (they should be close to base sizes now)
                // No additional scaling factor applied
                
                // Calculate background dimensions based on actual text
                p.textSize(finalTitleSize);
                p.textStyle(p.BOLD);
                var actualTitleWidth = p.textWidth(titleText);
                p.textSize(finalSubtitleSize);
                var actualSubtitleWidth = Math.max(p.textWidth(subtitleLine1), p.textWidth(subtitleLine2));
                // Removed white background box - text now uses the grey article background
                
                // Draw title
                p.fill(38, 38, 38, titleOpacity); // Dark gray text
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(finalTitleSize);
                p.textStyle(p.BOLD);
                p.text(titleText, titleX, titleY - 50);
                
                // Draw subtitle
                p.textSize(finalSubtitleSize);
                p.textStyle(p.NORMAL);
                p.fill(118, 118, 120, titleOpacity); // Lighter gray for subtitle
                p.text(subtitleText, titleX, titleY + 10);
            }
            
            p.pop();
        }
    };
})();
