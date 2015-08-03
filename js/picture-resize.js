(function($, _)
{
    var pluginName = "pictureResize";
    var pluginDataName = "plugin_" + pluginName;    

    function Plugin(element, options)
    {
        this._attachedEvents = [];

        this.element = element;
        this.$element = $(element);

        this.params = { width: 250, height: 250, size: 3 };
        this.params = $.fn.extend(this.params, options);  
        this.size = this.params.size * 1024 * 1024;

        this.scale = { min : 1, width : 1, height: 1 };

        this.drawingCanvas = null;
        this.windowCanvas = null;

        this.image = null; 

        this.startX = 0;
        this.startY = 0;

        this.file = null;

        this.values = { w: 0, h : 0 };

        this.init();
    }

    $.fn[pluginName] = function(options, p)
    {
        return this.each(function()
        {
            if(!$.data(this, pluginDataName))
            {
                $.data(this, pluginDataName, new Plugin(this, options));
            }
            else
            {
                if(typeof($.data(this, pluginDataName)[options]) === 'function')
                {
                    var v = $.data(this, pluginDataName)[options](p);
                }
            }
        });
    };

    Plugin.prototype = 
    {
        init : function()
        {
            this.initTemplate();
            this.initEvents();
        },
        initTemplate : function()
        {
            var template = '<div class="ddr-handler valign-wrapper" style="overflow:hidden;text-align:center"><p class="valign">Déposez votre photo ici.<br />Taille minimum : ' + this.params.width + 'x' + this.params.height + '<br />Poids maximum : ' + this.params.size + 'Mo</p></div>';
            var content = _.template(template);

            this.$element.html(content);
        },
        initEvents : function()
        {
            this.attachEvent(this.$element.find('.ddr-handler'), 'dragenter', this.onDragEnter.bind(this));
            this.attachEvent(this.$element.find('.ddr-handler'), 'dragleave', this.onDragLeave.bind(this));
            this.attachEvent(this.$element.find('.ddr-handler'), 'dragover', this.onDragOver.bind(this));
            this.attachEvent(this.$element.find('.ddr-handler'), 'drop', this.onDrop.bind(this));
        },
        attachEvent: function(el, ev, fn)
        {
            $(el).on(ev, fn);
            this._attachedEvents.push([$(el), ev, fn]);
        },
        detachEvents: function()
        {
            for(var i = this._attachedEvents.length - 1; i >= 0; i--)
            {
                var item = this._attachedEvents[i];
                    item[0].off(item[1], item[2]);

                this._attachedEvents.splice(i, 1);
            }
        },
        onDragEnter: function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            $(e.currentTarget).addClass('active');
            return false;
        },
        onDragLeave: function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            $(e.currentTarget).removeClass('active');
            return false;
        },
        onDragOver: function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            $(e.currentTarget).addClass('active');
            return false;
        },
        onDrop: function(e)
        {
            if(e.originalEvent.dataTransfer)
            {
                if(e.originalEvent.dataTransfer.files.length)
                {
                    e.preventDefault();
                    e.stopPropagation();

                    if(this.typeMatch(e.originalEvent.dataTransfer.files[0]))
                    {
                        if(this.sizeMatch(e.originalEvent.dataTransfer.files[0]))
                        {
                            this.readFile(e.originalEvent.dataTransfer.files);
                        }
                        else
                        {
                            this.displayError(2);
                        }
                    }
                    else
                    {
                        this.displayError(0);
                    }
                }  
            }
        },
        typeMatch: function(file)
        {
            console.log(file.type)
            return (file.type == "image/png" || file.type == "image/jpeg" || file.type == "image/jpg" || file.type == "image/gif");
        },
        sizeMatch: function(file)
        {
            return (file.size <= this.size);
        },
        onMouseUp: function(e)
        {
            $(this.windowCanvas).removeClass('moving');
        },
        onMouseDown: function(e)
        {
            $(this.windowCanvas).addClass('moving');

            var pos = this.getMousePosition(this.drawingCanvas, e);

            this.startX = pos.x;
            this.startY = pos.y;
        },
        onMouseMove: function(e)
        {
            if ($(this.windowCanvas).hasClass('moving'))
            {
                var pos = this.getMousePosition(this.drawingCanvas, e);

                var x = pos.x;
                var y = pos.y;                

                this.drawingCanvas.getContext('2d').translate(x - this.startX, y - this.startY);
                this.drawImage();
                
                this.startX = x;
                this.startY = y;
            }
        },
        readFile : function(files)
        {
            this.file = files[0];
            if(this.file)
            {
                var reader = new FileReader();
                    reader.onloadend = this.loadImage.bind(this);
                    reader.readAsDataURL(this.file);
            }
        },
        loadImage : function(e)
        {
            this.MAX_WIDTH = this.$element.find('.ddr-handler').width();
            this.MAX_HEIGHT = this.$element.find('.ddr-handler').height();

            this.image = document.createElement('img');
            this.image.setAttribute('src', e.target.result);

            this.scale.min = this.calculateMinScale();

            if(this.image.width >= this.params.width && this.image.height >= this.params.height)
            {
                this.createCanvas();
                this.appendSlider(); 
            }
            else
            {
                this.displayError(1);
            }
        },
        appendSlider : function()
        {
            if(this.scale.min < 1)
            {
                var w = this.$element.find('.ddr-handler').width();
                var st = $('<div style="position:absolute;bottom:10px;" class="ddr-slider-container" style="cursor:default"><input type="range" min="' + ((this.scale.min * 100)) + '" max="100" value="100" />').width(w);
                    this.attachEvent(st.find('input[type="range"]'), 'change', this.onSlide.bind(this));

                this.$element.find('.ddr-handler').after(st);
            }
        },
        displayError: function(x)
        {
            switch(x)
            {
                case 0: this.$element.find('.ddr-handler').html('<p class="valign">LE FICHIER N\'EST PAS UNE IMAGE<br />Taille minimum : ' + this.params.width + 'x' + this.params.height + '</p>'); break;
                case 1: this.$element.find('.ddr-handler').html('<p class="valign">VOTRE IMAGE EST TROP PETITE<br />Taille minimum : ' + this.params.width + 'x' + this.params.height + '</p>'); break;
                case 2: this.$element.find('.ddr-handler').html('<p class="valign">VOTRE IMAGE EST TROP LOURDE<br />Poids maximum : ' + this.params.size + 'Mo</p>'); break;
            }            
        },
        createCanvas : function()
        {
            this.drawingCanvas = document.createElement('canvas');
            this.drawingCanvas.setAttribute('id', 'drawingCanvas');
            this.drawingCanvas.setAttribute('style', 'width: ' + this.MAX_WIDTH + 'px;height: ' + this.MAX_HEIGHT + 'px;');
            this.drawingCanvas.width = this.MAX_WIDTH;
            this.drawingCanvas.height = this.MAX_HEIGHT;

            this.$element.find('.ddr-handler').html(this.drawingCanvas);
            
            this.drawImage();

            this.createWindow();
        },
        createWindow : function()
        {
            this.windowCanvas = document.createElement('canvas');
            this.windowCanvas.setAttribute('id', 'windowCanvas');
            this.windowCanvas.setAttribute('style', 'position: absolute; left: 24px; top: 24px; width: ' + this.MAX_WIDTH + 'px;height: ' + this.MAX_HEIGHT + 'px;cursor:move;');
            this.windowCanvas.width = this.MAX_WIDTH;
            this.windowCanvas.height = this.MAX_HEIGHT;

            this.attachEvent(this.windowCanvas, 'mouseup', this.onMouseUp.bind(this));
            this.attachEvent(this.windowCanvas, 'mousedown', this.onMouseDown.bind(this));
            this.attachEvent(this.windowCanvas, 'mousemove', this.onMouseMove.bind(this));

            this.$element.find('.ddr-handler').append(this.windowCanvas);

            var x = (this.windowCanvas.width - this.params.width) / 2;
            var y = (this.windowCanvas.height - this.params.height) / 2;

            var context = this.windowCanvas.getContext('2d');
                context.fillStyle = "rgba(255, 255, 255, 0.8)";
                context.fillRect(0, 0, this.windowCanvas.width,this.windowCanvas.height);
                context.clearRect(x, y, this.params.width, this.params.height);
        },
        drawImage : function()
        {
            this.clearCanvas(this.drawingCanvas);

            this.values.w = this.image.width / this.scale.width;
            this.values.h = this.image.height / this.scale.height;

            var x = ((this.drawingCanvas.width / this.scale.width) - this.image.width) / 2;
            var y = ((this.drawingCanvas.height / this.scale.height) - this.image.height) / 2;

            var context = this.drawingCanvas.getContext('2d');
                context.save();
                context.scale(this.scale.width, this.scale.height);
                context.drawImage(this.image, x, y);
                context.restore();
        },
        clearCanvas : function(canvas)
        {
            var context = canvas.getContext('2d');
                context.clearRect(-this.values.w, -this.values.h, this.values.w * 3, this.values.h * 3);
        },
        onSlide : function(e)
        {
            var val = $(e.currentTarget).val();

            this.scale.width = (parseInt(val) / 100);
            this.scale.height = (parseInt(val) / 100);

            this.drawImage();
        },
        calculateMinScale : function()
        {
            var ref = this.image.width;
            if(this.image.width > this.image.height)
                ref = this.image.height;

            return Math.round((this.params.width / ref) * 100) / 100;
        },
        getResult : function(fn)
        {
            var x = (this.drawingCanvas.width - this.params.width) / 2;
            var y = (this.drawingCanvas.height - this.params.height) / 2;

            var context = this.drawingCanvas.getContext('2d');
            var data = context.getImageData(x, y, this.params.width, this.params.height);

            var resultCanvas = document.createElement('canvas');
                resultCanvas.setAttribute('id', 'resultCanvas');
                resultCanvas.width = this.params.width;
                resultCanvas.height = this.params.height;

            this.clearCanvas(resultCanvas);

            var context = resultCanvas.getContext('2d');
                context.putImageData(data,0,0);
            var imageUrl = resultCanvas.toDataURL("image/png");

            if (resultCanvas.toBlob)
            {
                resultCanvas.toBlob(
                    function (blob)
                    {
                        fn(this.file, blob);
                    }.bind(this),
                    'image/png'
                );
            }
        },
        constructFile : function(data)
        {
            var BlobBuilder = new Blob([data.replace(/^data:image\/png;base64,/,"")], { type : "image/png" });
            return BlobBuilder;
        },
        getMousePosition: function(canvas, evt)
        {
            var rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        },
        destroy: function()
        {
            this.detachEvents();
        }
    };
})(jQuery, _);
