// data_loader.js
// Simple data loading and TSV parsing module. Exposes DataLoader.loadTSV(url)
(function () {
    function parseTSV(text) {
        var lines = (text || '').trim().split(/\r?\n/);
        if (!lines || lines.length === 0) return [];
        var header = lines[0].split('\t');
        var rows = lines.slice(1);
        return rows.map(function (line) {
            var parts = line.split('\t');
            var word = (parts[0] || '').replace(/^"|"$/g, '');
            var time = parseFloat(parts[1]);
            var filler = parts[2] ? (parts[2].trim() === '1' || parts[2].trim() === 'true') : false;
            return { word: word, time: time, filler: filler, min: Math.floor(time / 60) };
        });
    }

    function loadTSV(p, url) {
        return new Promise(function (resolve, reject) {
            p.loadTable(url, 'header', 'csv', function (table) {
                if (table) {
                    // Convert p5.Table to array of objects
                    var rows = [];
                    var columnCount = table.getColumnCount();
                    var rowCount = table.getRowCount();
                    
                    // Get column names
                    var columns = [];
                    for (var j = 0; j < columnCount; j++) {
                        columns.push(table.columns[j]);
                    }
                    
                    // Convert each row to an object
                    for (var i = 0; i < rowCount; i++) {
                        var row = table.getRow(i);
                        var obj = {};
                        for (var k = 0; k < columns.length; k++) {
                            var colName = columns[k];
                            obj[colName] = row.getString(colName);
                        }
                        rows.push(obj);
                    }
                    resolve(rows);
                } else {
                    reject(new Error('Failed to load table from ' + url));
                }
            });
        });
    }

    window.DataLoader = {
        parseTSV: parseTSV,
        loadTSV: loadTSV
    };

    // Shared preprocess helper: normalize rows into the shape sketches expect.
    // Accepts an array of objects {word, time, filler, min} (as returned by parseTSV)
    // and returns an array with guaranteed types and an index property.
    window.DataLoader.preprocess = function (data) {
        data = data || [];
        return data.map(function (d, i) {
            return {
                word: (d.word || '').replace(/^"|"$/g, ''),
                filler: !!d.filler,
                time: +d.time || 0,
                min: (typeof d.min === 'number') ? d.min : Math.floor((+d.time || 0) / 60),
                index: i
            };
        });
    };
})();
