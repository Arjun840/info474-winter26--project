// viz_stability.js
// Scatterplot visualization: Elevation vs. Snow Reliability
// Draws a scatterplot with animated dots based on scroll progress
(function () {
    window.VizStability = {
        draw: function (p, manager, ai, progress) {
            // Only draw when ai matches the intended step (e.g., ai === 2 or ai === 3)
            if (ai !== 2 && ai !== 3) {
                return;
            }

            var data = manager.resortData || [];
            if (!data || data.length === 0) {
                return;
            }

            p.push();

            // 1. Hardcoded Margins (increased to prevent dots from covering labels)
            var m = 120; // Increased from 100 to give more space for labels
            
            // Chart area
            var chartX = m;
            var chartY = m;
            var chartWidth = p.width - 2 * m;
            var chartHeight = p.height - 2 * m;

            // Define colors: Alpine Blue to Earth Brown
            var alpineBlue = [70, 130, 180];   // Steel blue
            var earthBrown = [139, 90, 43];   // Earth brown

            // Color palette from CSS (matching index.html styling)
            var textColor = [38, 38, 38];      // #262626 for titles
            var bodyTextColor = [118, 118, 120]; // #767678 for body text
            var axisColor = [102, 102, 102];   // #666 for axes
            
            // Font styling
            var fontSize = 12;
            var fontSizeSmall = 10;

            // 3. Visible Labels: Draw red rectangle border
            p.stroke(255, 0, 0);
            p.strokeWeight(2);
            p.noFill();
            p.rect(0, 0, p.width, p.height);

            // Draw vertical gradient background (only in chart area)
            p.noStroke();
            for (var y = 0; y < chartHeight; y++) {
                var inter = y / chartHeight;
                var r = p.lerp(alpineBlue[0], earthBrown[0], inter);
                var g = p.lerp(alpineBlue[1], earthBrown[1], inter);
                var b = p.lerp(alpineBlue[2], earthBrown[2], inter);
                p.stroke(r, g, b);
                p.line(chartX, chartY + y, chartX + chartWidth, chartY + y);
            }

            // Calculate data ranges
            var highestPoints = data.map(function (d) {
                return parseFloat(d['Highest point']) || 0;
            });
            var reliabilities = data.map(function (d) {
                return parseFloat(d['reliability']) || 0;
            });
            var avgSnows = data.map(function (d) {
                return parseFloat(d['avg_snow']) || 0;
            });

            // 2. Axis Calibration: X-domain fixed at 1000 to 3500
            var xDomainMin = 1000;
            var xDomainMax = 3500;
            var xDomainRange = xDomainMax - xDomainMin;
            
            var minReliability = 0; // Fixed domain
            var maxReliability = 1; // Fixed domain
            
            // For color mapping, use avg_snow
            var minAvgSnow = Math.min.apply(null, avgSnows);
            var maxAvgSnow = Math.max.apply(null, avgSnows);
            var avgSnowRange = maxAvgSnow - minAvgSnow || 1;
            
            // Scale function for X-axis: map from m to p.width - m
            var scaleX = function (val) {
                return m + ((val - xDomainMin) / xDomainRange) * (p.width - 2 * m);
            };

            // Scale function for Y-axis: map from p.height - m to m (inverted)
            var scaleY = function (val) {
                return (p.height - m) - (val / (maxReliability - minReliability)) * (p.height - 2 * m);
            };

            // Draw grid lines first (behind everything)
            var gridOpacity = p.lerp(0, 100, Math.max(0, (progress - 0.2) / 0.8));
            if (gridOpacity > 0) {
                p.stroke(axisColor[0], axisColor[1], axisColor[2], gridOpacity * 0.3);
                p.strokeWeight(0.5);
                
                // X-axis grid lines (vertical) - use fixed domain
                var xTicks = 5;
                for (var i = 0; i <= xTicks; i++) {
                    var tickVal = xDomainMin + (xDomainRange / xTicks) * i;
                    var tickX = scaleX(tickVal);
                    p.line(tickX, chartY, tickX, chartY + chartHeight);
                }
                
                // Y-axis grid lines (horizontal) - fixed 0-1 domain
                var yTicks = 5;
                for (var j = 0; j <= yTicks; j++) {
                    var tickVal = minReliability + (maxReliability - minReliability) / yTicks * j;
                    var tickY = scaleY(tickVal);
                    p.line(chartX, tickY, chartX + chartWidth, tickY);
                }
            }
            
            // Draw axes
            p.stroke(axisColor[0], axisColor[1], axisColor[2]);
            p.strokeWeight(2);
            p.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X-axis
            p.line(chartX, chartY, chartX, chartY + chartHeight); // Y-axis

            // Draw axis tick marks and labels
            var labelOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.2) / 0.8));
            
            p.noStroke();
            p.fill(textColor[0], textColor[1], textColor[2], labelOpacity);
            
            // X-axis ticks and labels (fixed domain 1000-3500)
            var xTicks = 5;
            for (var i = 0; i <= xTicks; i++) {
                var tickVal = xDomainMin + (xDomainRange / xTicks) * i;
                var tickX = scaleX(tickVal);
                
                // Draw tick mark
                p.stroke(axisColor[0], axisColor[1], axisColor[2], labelOpacity);
                p.strokeWeight(1.5);
                p.line(tickX, chartY + chartHeight, tickX, chartY + chartHeight + 5);
                p.noStroke();
                
                // Draw rotated label (45 degrees)
                p.push();
                p.translate(tickX, chartY + chartHeight + 20);
                p.rotate(p.PI / 4); // 45 degrees
                p.fill(textColor[0], textColor[1], textColor[2], labelOpacity);
                p.textAlign(p.CENTER, p.TOP);
                p.textSize(fontSizeSmall);
                var labelText = Math.round(tickVal) + 'm';
                p.text(labelText, 0, 0);
                p.pop();
            }

            // Y-axis ticks and labels (fixed 0-1 domain)
            var yTicks = 5;
            for (var j = 0; j <= yTicks; j++) {
                var tickVal = minReliability + (maxReliability - minReliability) / yTicks * j;
                var tickY = scaleY(tickVal);
                
                // Draw tick mark
                p.stroke(axisColor[0], axisColor[1], axisColor[2], labelOpacity);
                p.strokeWeight(1.5);
                p.line(chartX, tickY, chartX - 5, tickY);
                p.noStroke();
                
                // Draw label with RIGHT alignment
                p.fill(textColor[0], textColor[1], textColor[2], labelOpacity);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(fontSizeSmall);
                var percentVal = Math.round(tickVal * 100);
                p.text(percentVal + '%', chartX - 8, tickY);
            }

            // 3. Visible Labels: Place axis labels
            p.fill(textColor[0], textColor[1], textColor[2], labelOpacity);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(fontSize);
            p.text('ELEVATION', p.width / 2, p.height - 20);
            
            // RELIABILITY label with rotation
            p.push();
            p.translate(20, p.height / 2);
            p.rotate(-p.PI / 2);
            p.text('RELIABILITY', 0, 0);
            p.pop();

            // Prepare data with colors based on avg_snow
            var dataWithColors = data.map(function (d) {
                var elevation = parseFloat(d['Highest point']) || 0;
                var reliability = parseFloat(d['reliability']) || 0;
                var avgSnow = parseFloat(d['avg_snow']) || 0;
                var x = scaleX(elevation);
                var y = scaleY(reliability);
                
                // Color interpolation: brown (low avg_snow) to blue (high avg_snow)
                var snowInter = (avgSnow - minAvgSnow) / avgSnowRange;
                var r = Math.floor(p.lerp(earthBrown[0], alpineBlue[0], snowInter));
                var g = Math.floor(p.lerp(earthBrown[1], alpineBlue[1], snowInter));
                var b = Math.floor(p.lerp(earthBrown[2], alpineBlue[2], snowInter));
                
                return {
                    elevation: elevation,
                    reliability: reliability,
                    avgSnow: avgSnow,
                    x: x,
                    y: y,
                    color: [r, g, b],
                    name: d['Resort'] || 'Unknown'
                };
            });
            
            // 4. Data Points: Make dots larger (size 10)
            var numPoints = data.length;
            var dotSize = 10;
            
            for (var i = 0; i < numPoints; i++) {
                var point = dataWithColors[i];
                
                // 2. Clip points outside X-domain (1000-3500)
                if (point.elevation < xDomainMin || point.elevation > xDomainMax) {
                    continue; // Skip points outside domain
                }
                
                var pointProgress = (i + 1) / numPoints;
                var shouldShow = pointProgress <= progress;
                var opacity = shouldShow ? 255 : 0;
                
                // Animate position (slide in from left)
                var animOffset = 0;
                if (shouldShow && progress > 0) {
                    var animProgress = pointProgress / progress;
                    animOffset = (1 - animProgress) * 50;
                } else if (!shouldShow) {
                    animOffset = 50;
                }
                var animX = point.x - animOffset;

                // Only draw if point is within chart bounds (with extra padding to prevent spillover)
                var dotRadius = dotSize / 2;
                if (opacity > 0 && 
                    point.x >= chartX + dotRadius && point.x <= chartX + chartWidth - dotRadius && 
                    point.y >= chartY + dotRadius && point.y <= chartY + chartHeight - dotRadius) {
                    p.stroke(255, 255, 255, opacity * 0.8);
                    p.strokeWeight(1.5);
                    p.fill(point.color[0], point.color[1], point.color[2], opacity);
                    p.ellipse(animX, point.y, dotSize, dotSize);
                }
            }
            
            p.noStroke();

            // Clean Highlighting System: Specify resort names to highlight
            // Add resort names to this array to highlight them
            var highlightedResorts = []; // Example: ['Vail', 'Aspen', 'Whistler']
            var highlightOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.5) / 0.5));
            
            if (highlightOpacity > 0 && highlightedResorts.length > 0) {
                // First pass: draw all regular points
                // (already done above)
                
                // Second pass: draw highlighted points with glow effect
                for (var i = 0; i < numPoints; i++) {
                    var point = dataWithColors[i];
                    
                    // Skip if outside domain
                    if (point.elevation < xDomainMin || point.elevation > xDomainMax) {
                        continue;
                    }
                    
                    // Check if this resort should be highlighted
                    var isHighlighted = highlightedResorts.indexOf(point.name) !== -1;
                    
                    if (isHighlighted && point.x >= chartX && point.x <= chartX + chartWidth && 
                        point.y >= chartY && point.y <= chartY + chartHeight) {
                        
                        // Draw glow ring
                        p.noFill();
                        p.stroke(255, 255, 0, highlightOpacity * 0.6); // Yellow glow
                        p.strokeWeight(3);
                        p.ellipse(point.x, point.y, dotSize + 8, dotSize + 8);
                        
                        // Draw larger dot for highlighted resort
                        p.stroke(255, 255, 255, highlightOpacity);
                        p.strokeWeight(2);
                        p.fill(point.color[0], point.color[1], point.color[2], highlightOpacity);
                        p.ellipse(point.x, point.y, dotSize + 2, dotSize + 2);
                    }
                }
            }

            // "Snow-Sure Zone" label (top 20% of chart)
            var snowSureOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.4) / 0.6));
            if (snowSureOpacity > 0) {
                var snowSureY = chartY + chartHeight * 0.2; // Top 20%
                
                // Draw faint background
                p.noStroke();
                p.fill(255, 255, 255, snowSureOpacity * 0.2);
                p.rect(chartX, chartY, chartWidth, chartHeight * 0.2);
                
                // Draw border line
                p.stroke(255, 255, 255, snowSureOpacity * 0.8);
                p.strokeWeight(2);
                p.line(chartX, snowSureY, chartX + chartWidth, snowSureY);
                
                // Label
                p.fill(textColor[0], textColor[1], textColor[2], snowSureOpacity);
                p.noStroke();
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(fontSizeSmall);
                var labelText = 'Snow-Sure Zone';
                var textW = p.textWidth(labelText);
                var padding = 8;
                
                // Background box
                p.fill(255, 255, 255, snowSureOpacity);
                p.stroke(textColor[0], textColor[1], textColor[2], snowSureOpacity * 0.3);
                p.strokeWeight(1);
                p.rect(chartX + 10, snowSureY - 15, textW + padding * 2, 20, 3);
                
                p.fill(textColor[0], textColor[1], textColor[2], snowSureOpacity);
                p.noStroke();
                p.text(labelText, chartX + 10 + padding, snowSureY - 5);
            }

            // External Key/Legend: Vertical color scale on the right
            var legendOpacity = p.lerp(0, 255, Math.max(0, (progress - 0.3) / 0.7));
            if (legendOpacity > 0) {
                var keyX = chartX + chartWidth + 10;
                var keyY = chartY;
                var keyWidth = 30;
                var keyHeight = chartHeight;
                
                // Draw vertical gradient
                p.noStroke();
                for (var k = 0; k < keyHeight; k++) {
                    var inter = k / keyHeight;
                    var r = p.lerp(earthBrown[0], alpineBlue[0], inter);
                    var g = p.lerp(earthBrown[1], alpineBlue[1], inter);
                    var b = p.lerp(earthBrown[2], alpineBlue[2], inter);
                    p.stroke(r, g, b, legendOpacity);
                    p.line(keyX, keyY + k, keyX + keyWidth, keyY + k);
                }
                
                // Draw border around gradient
                p.stroke(textColor[0], textColor[1], textColor[2], legendOpacity * 0.8);
                p.strokeWeight(2);
                p.noFill();
                p.rect(keyX, keyY, keyWidth, keyHeight);
                
                // Label "Snowfall Intensity" (rotated)
                p.fill(textColor[0], textColor[1], textColor[2], legendOpacity);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.push();
                p.translate(keyX + keyWidth + 25, keyY + keyHeight / 2);
                p.rotate(-p.PI / 2);
                p.textSize(fontSizeSmall);
                p.text('Snowfall Intensity', 0, 0);
                p.pop();
                
                // Add color explanation labels
                p.fill(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2], legendOpacity);
                p.noStroke();
                p.textAlign(p.LEFT, p.CENTER);
                p.textSize(fontSizeSmall - 1);
                
                // "Low" label at bottom (brown)
                p.text('Low', keyX + keyWidth + 5, keyY + keyHeight - 5);
                
                // "High" label at top (blue)
                p.text('High', keyX + keyWidth + 5, keyY + 5);
                
                // Add small color indicator dots next to labels
                p.stroke(255, 255, 255, legendOpacity);
                p.strokeWeight(1.5);
                
                // Brown dot for "Low"
                p.fill(earthBrown[0], earthBrown[1], earthBrown[2], legendOpacity);
                p.ellipse(keyX + keyWidth + 25, keyY + keyHeight - 5, 8, 8);
                
                // Blue dot for "High"
                p.fill(alpineBlue[0], alpineBlue[1], alpineBlue[2], legendOpacity);
                p.ellipse(keyX + keyWidth + 25, keyY + 5, 8, 8);
                
                p.noStroke();
            }

            // Draw title
            var titleOpacity = p.lerp(0, 255, Math.max(0, progress / 0.3));
            p.fill(255, 255, 255, titleOpacity);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(14);
            p.text('Elevation vs. Snow Reliability', chartX + chartWidth / 2, chartY - 30);

            p.pop();
        }
    };
})();
