/*
* Author : ok8008@yeah.net
* link : https://github.com/liutian1937/Popbox
*/
(function($){
	var defaults = {
		id : false, //指定id,用于编辑操作，不会被其他层覆盖掉
		type : 'pop', //弹出层类型
		title : '消息提示', //顶部标题
		msg : '', //内容，支持html，msg
		mark : true, //是否显示遮罩层
		width : 400,
		height : 'auto',
		init : false, //初始化前执行的操作
		ready : false , //初始化后执行的函数，用于表单的编辑操作
		complete : false, //确认事件回调
		cancle : false, //取消后的操作
		close : false, //关闭弹出层的回调
		completeText : '确定', //完成按钮的文字
		cancelText : '取消', //取消按钮的文字
		loadingImg : 'loading.gif', //loading图片的路径
		reload : true, //是否需要重载数据，只有设置id才会生效
		drag : true //是否允许拖拽
	}
	var Tools = {
		shake : function (element) {
			var left = parseInt(element.css('left'));
			for (var i = 1; 4 >= i; i++) {
				element.animate({
					left: left - (12 - 3 * i) + 'px'
				},50);
				element.animate({
					left: left + 2 * (12 - 3 * i) + 'px'
				},50);
			}
		},
		drag : function (element,limit) {
            var header = element.find('.popTitle'),elementX, elementY, pointX, pointY, currentLeft , currentTop,
                preventDefault = function(e){
                    e.stopPropagation();
                    e.preventDefault();
                },
                mouseDown = function (e) {
                    $(document).on('mousemove', mouseMove);
                    $(document).on('mouseup', mouseUp);
                    elementX = currentLeft = parseFloat(element.css('left'));
                    elementY = currentTop = parseFloat(element.css('top'));
                    pointX = e.pageX;
                    pointY = e.pageY;
                    preventDefault(e);
                }, mouseMove = function (e) {
					element.addClass('dragActive');
                    currentLeft = elementX + e.pageX - pointX;
                    currentTop = elementY + e.pageY - pointY;
					currentLeft = currentLeft <= 0 ? 0 : currentLeft;
					currentLeft = currentLeft >= limit.limLeft ? limit.limLeft : currentLeft;
					currentTop = currentTop <= 0 ? 0 : currentTop;
					currentTop = currentTop >= limit.limTop ? limit.limTop : currentTop;
                    element.css('left', currentLeft);
                    element.css('top', currentTop);
                    preventDefault(e);
                }, mouseUp = function (e) {
                    $(document).unbind('mousemove', mouseMove);
                    $(document).unbind('mouseup', mouseUp);
					element.removeClass('dragActive');
                    preventDefault(e);
                };
            header.on('mousedown', mouseDown);
		} 
	}
	var Pop = function (params) {
		var params = params || {};
		var PopObj = params.id ? 'Global_'+params.id : 'Global_PopBox';
		if(!window[PopObj]){
			if(!(window[PopObj] instanceof PopIt)){
				window[PopObj] = new PopIt(params);
				return window[PopObj];
			}
		}else{
			window[PopObj].show(params);
			return window[PopObj];
		};
	};
	var PopIt = function (params) {
		this.obj = {};
		this.element = null;
		if(params.init && typeof params.init === 'function'){
			params.init();
		}
		this.show(params);
	};
	PopIt.fn = PopIt.prototype;
	PopIt.fn.show = function (params, InitType) {
		var _this = this, height;
		$('#popMark,.popBox').hide();
		//是否需要重载窗口
		if(_this.element && _this.options.id && !_this.options.reload){
			if(_this.options.mark){
				$('#popMark').show();
			}
			_this.element.show();
			_this._ready(); //窗口初始化结束，执行
			return false;
		}
		
		_this.options = $.extend({}, defaults,params);

		//设置是否显示mark遮罩
		if(_this.options.mark){
			if($('#popMark').length < 1) {
				$('body').append('<div id="popMark" style="z-index: 1999;"></div>');
			};
			$('#popMark').height($(document).height());
			$('#popMark').show();
		};
		switch(params.type){
			case 'alert' : 
				_this.options['width'] = 300;
				_this.options['cancelText'] = false;
				_this.options['complete'] = function () {
					_this.close();
				}
				break;
			case 'confirm' :
				_this.options['width'] = 300;
				break;
			case 'prompt' :
				_this.options['width'] = 300;
				_this.options['msg'] = '<form name="popForm" onsubmit="return false;"><ul class="formWrap popList"><div style="margin-left:0;margin-right:22px;"><input type="text" class="popInput" name="popInput" value="" style="width:100%;"></div></ul></form>';
				break;
		}
		
		if(!_this.element) {
			//不存在弹出层，创建
			_this._createObj(_this.options);
		}else{
			_this.obj.titleObj.html(_this.options.title); //赋值title
			_this.obj.bodyObj.html(_this.options.msg); //赋值msg
		}
		
		_this.obj.closeObj.on('click',function(){
			_this.close();
		});
		
		_this.obj.bottomObj.html('');
		if(_this.options.completeText){
			//重新绑定complete事件
			_this.obj['completeObj'] = $('<a href="javascript:void(0);" class="btn blue popComplete">'+_this.options.completeText+'</a>');
			_this.obj.bottomObj.append(_this.obj['completeObj']);
			_this.obj['completeObj'].off('click');
			_this.obj['completeObj'].on('click',function(){
				if($(this).find('.popLoading').length > 0){
					return false;
				}
				_this._complete();
			});
		}
		if(_this.options.cancelText){
			//重新绑定cancel事件
			_this.obj['cancelObj'] = $('<a href="javascript:void(0);" class="btn gray popCancel">'+_this.options.cancelText+'</a>');
			_this.obj.bottomObj.append(_this.obj['cancelObj']);
			_this.obj['cancelObj'].off('click');
			_this.obj['cancelObj'].on('click',function(){
				_this._cancel();
			});
		}
		
		_this._ready(); //窗口初始化结束，执行
		if(InitType !== 'step'){
			_this._resize(); //初始化窗口的位置
		}
		$(window).on('resize',function(){
			_this._resize();
		})
		
		_this.element.show();
		
	};
	
	
	PopIt.fn._createObj = function (params) {
		//创建弹出层，缓存btn
		var _this = this, title, width, height, classes, id;
		title = params.title || defaults.title;
		width = params.width == 'auto' ? 'auto' : params.width +'px';
		height = params.height == 'auto' ? 'auto' : params.height +'px';
		classes = 'popBox '+_this.options.type;
		id = _this.options.id ? _this.options.id : '';
		_this.element = $('<div class="'+classes+'" id="'+id+'" style="width:'+width+';height:'+height+';"><a href="javascript:;" class="popClose">×</a><h3 class="yahei popTitle">'+title+'</h3><div class="popBody">'+params.msg+'</div><div class="popBottom"></div></div>');
		_this.obj['titleObj'] = _this.element.find('.popTitle'); //缓存title对象
		_this.obj['bodyObj'] = _this.element.find('.popBody'); //缓存body对象
		_this.obj['closeObj'] = _this.element.find('.popClose'); //缓存close对象
		_this.obj['bottomObj'] = _this.element.find('.popBottom'); //缓存bottom对象
		$('body').append(_this.element);
	}
	PopIt.fn._initSize = function () {
		var _this = this, element = _this.element, params = _this.options, width = params.width, height = params.height, left, top, tempWidth, tempHeight;
		isNaN(width) ? (function(){
			width = 'auto';
			tempWidth = element.width() ;
		})() : (function(){
			tempWidth = parseInt(width);
			width = parseInt(width)+'px';
		})();
		isNaN(height) ? (function(){
			height = 'auto';
			tempHeight = element.height() ;
			
		})() : (function(){
			tempHeight = parseInt(height);
			height = parseInt(height)+'px';
		})();
		
		left = (_this.winSize.width - tempWidth)/2 + 'px';
		_this.winSize['limLeft'] = _this.winSize.width - tempWidth ;
		top = (_this.winSize.height - tempHeight)/2 + 'px';
		_this.winSize['limTop'] = _this.winSize.height - tempHeight ;
		
		element.css({
			'width' : width,
			'height' : height,
			'left': left,
			'top' : top
		});
	}
	PopIt.fn._ready = function () {
		var _this = this, ready = _this.options.ready;
		if(ready && typeof ready === 'function'){
			ready.call(_this);
		}
	}
	PopIt.fn._complete = function () {
		var _this = this, complete = _this.options.complete, data, ret = true;
		if(_this.options.type == 'prompt') {
			data = _this.element.find('.popInput').val();
			if(data == ''){
				Tools.shake(_this.element);
				return false;
			}
		}
		if(complete && typeof complete === 'function'){
			ret = complete.call(_this,data); //执行回调
		}
		if(ret){
			_this.close();
		}
	}
	PopIt.fn._cancel = function () {
		var _this = this, cancel = _this.options.cancel, ret = true;
		if(cancel && typeof cancel === 'function'){
			ret = cancel.call(_this);
		};
		if(ret){
			_this.close();
		}
	}
	PopIt.fn.close = function () {
		var _this = this, close = _this.options.close;
		if(close && typeof close === 'function'){
			close.call(_this);
		};
		this.element.hide();
		$('#popMark').hide();
	}
	PopIt.fn._resize = function () {
		var _this = this;
		_this.winSize = {
			width : $(window).width(),
			height : $(window).height()
		}
		_this._initSize();
		if(_this.options.drag){
			Tools.drag(_this.element,_this.winSize); //绑定拖拽事件
		}
	}
	PopIt.fn.step = function (params) {
		this.show(params,'step');
	}
	PopIt.fn.loading = function (loadingPar,type) {
		if(type == 'end'){
			loadingPar.find('.popLoading').remove();
		}else{
			if(loadingPar.find('.popLoading').length < 1)
			loadingPar.append('<div class="popLoading"><img src="'+this.options.loadingImg+'"></div>');
		}
	}
	window.Pop = Pop;
})(jQuery);
