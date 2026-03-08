// sketch_manager.js

function startP5() {

    var localRenderer;
    // localRenderer = window.TemplateRenderer;
    localRenderer = window.Renderer;

    // --- Sketch manager ----------------------------------------------------
    function SketchManager() {
        // core layout settings (canvas size only)
        this.width = 600; // content width
        this.height = 520; // content height
        this.margin = { top: 0, left: 80, bottom: 40, right: 200 }; // Increased right margin for key
        this.canvasWidth = this.width + this.margin.left + this.margin.right;
        this.canvasHeight = this.height + this.margin.top + this.margin.bottom;

        // drawing state - initialize with progress 1.0 so title shows immediately
        this.state = { activeIndex: 0, progress: 1.0 };

        // data will be attached by localRenderer.setData(manager, data)
        this.data = [];

        // create the p5 instance bound to this manager
        var self = this;
        var sketch = function (p) {
            p.setup = function () {
                var parent = document.getElementById('vis');
                parent.innerHTML = '';
                p.createCanvas(self.canvasWidth, self.canvasHeight).parent('vis');
                p.noStroke();
                p.frameRate(30);
            };

            p.draw = function () {
                p.background(255);
                self.draw(p);
            };
        };

        this.p5 = new p5(sketch);
    }


    // set visualization state (called by scroll logic)
    SketchManager.prototype.setState = function (s) {
        if (s.activeIndex !== undefined) this.state.activeIndex = s.activeIndex;
        if (s.progress !== undefined) this.state.progress = s.progress;
    };

    // delegate data handling to localRenderer
    SketchManager.prototype.setData = function (newData) {
        return localRenderer.setData(this, newData);
    };

    // simple drawing routine, split into helpers for clarity
    SketchManager.prototype.draw = function (p) {
        var ai = this.state.activeIndex || 0;
        var progress = this.state.progress || 0;
        localRenderer.draw(p, this, ai, progress);
    };

    // create (or replace) singleton manager and expose API
    if (window.__sketchAPI && window.__sketchAPI.p5) {
        try { window.__sketchAPI.p5.remove(); } catch (e) { }
        window.__sketchAPI = null;
    }
    var manager = new SketchManager();
    // initialize data via localRenderer (fail fast if missing)
    if (!localRenderer || typeof localRenderer.setData !== 'function') {
        throw new Error('localRenderer.setData is required at startup.');
    }

    // Load both CSV files using the p5 instance
    var dataLoadPromise = new Promise(function (resolve, reject) {
        // Wait for p5 to be ready, then load both files
        setTimeout(function () {
            var p = manager.p5;
            if (!p || !window.DataLoader || typeof window.DataLoader.loadTSV !== 'function') {
                reject(new Error('p5 instance or DataLoader.loadTSV not available'));
                return;
            }

            // Load both files in parallel
            var resortDataPromise = window.DataLoader.loadTSV(p, 'data/processed_resorts.csv');
            var monthlyDataPromise = window.DataLoader.loadTSV(p, 'data/resort_monthly_snow.csv');

            Promise.all([resortDataPromise, monthlyDataPromise])
                .then(function (results) {
                    manager.resortData = results[0];
                    manager.monthlyData = results[1];
                    resolve();
                })
                .catch(function (err) {
                    console.error('Failed to load data files:', err);
                    reject(err);
                });
        }, 100); // Small delay to ensure p5 is initialized
    });

    var setDataResult = localRenderer.setData(manager);

    var api = {
        setState: manager.setState.bind(manager),
        setData: manager.setData.bind(manager),
        p5: manager.p5,
        data: manager.data
    };

    // Expose a `ready` promise so callers can wait until data/layout are ready.
    // Wait for both the data files to load AND the renderer setData to complete
    var allPromises = [dataLoadPromise];
    if (setDataResult && typeof setDataResult.then === 'function') {
        allPromises.push(setDataResult);
    }

    api.ready = Promise.all(allPromises).then(function () {
        return api;
    });

    // Expose the API globally once ready so consumers (like sections) see
    // the populated data without racing the async load.
    api.ready.then(function () {
        try { window.__sketchAPI = api; } catch (e) { }
    }).catch(function () {
        try { window.__sketchAPI = api; } catch (e) { }
    });

    return api;
}
