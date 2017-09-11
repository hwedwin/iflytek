define(function() {
	function createXHR() {
		if(typeof XMLHttpRequest != 'undefined') {
			return new XMLHttpRequest();
		} else if(typeof ActiveXObject != 'undefined') {
			if(typeof arguments.callee.activeXString != 'string') {
				var versions = ['MSXML2.XMLHttp.6.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp'],
					i,
					len;
				for (var i = 0, len = versions.length; i < len; i++) {
					try {
						new ActiveXObject(versions[i]);
						arguments.callee.activeXString = versions[i];
						break;
					} catch(exception) {
						//跳过
					}
				}
			}
		} else {
			throw new Error('No XHR Object available.');
		}
	}
	var xhr = new createXHR(),
		async = true,
		dataType = 'json',
		ajax = {
		get: function(url, data, success, complete) {
			if(typeof url != 'string') {
				throw new Error('request url is undefined');
			}
			var res = {},
				props = [];
			if(typeof data === 'object') {
				//传入了参数data,
				data = data;
			}else if(typeof data === 'function') {
				//没传参数data，但传了函数
				complete = success;
				success = data;
			}else if(typeof data === 'undefined') {
				//没有传入参数，也没有传入函数
				data = {};
			}
			for(var prop in data) {
				props.push(prop + '=' + data[prop]);
			}
			props = props.join('&');
			props = props == [] ? '' : '?' + props;
			xhr.open('get', url + props, async);
			xhr.setRequestHeader('dataType', dataType);
			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
						if(typeof success === 'undefined') {
							//没有传入函数
							return;
						}
						if(typeof success === 'function') {
							res = JSON.parse(xhr.response);
							success(res);
						}else {
							throw new Error('success is not a function or undefined');
						}
					}
					if(!complete) {
						//如果没有传入完成函数，不做任何操作。
						return;
					}
					if(complete && typeof complete === 'function') {
						res = xhr.response;
						complete(res);
					}else {
						throw new Error('complete is not a function or undefined');
					}
				}
			}
			xhr.send(null);
		},
		post: function(url, data, success, complete) {
			if(typeof url != 'string') {
				throw new Error('request url is undefined');
			}
			var res = {},
				props = [];
			if(typeof data === 'object') {
				//传入了参数data
				data = data;
			}else if(typeof data === 'function') {
				//没传参数data，但传了函数
				complete = success;
				success = data;
			}else if(typeof data === 'undefined') {
				//没有传入参数，也没有传入函数
				data = {};
			}
			for(var prop in data) {
				props.push(prop + '=' + data[prop]);
			}
			xhr.open('post', url, async);
			xhr.setRequestHeader('dataType', dataType);
			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
						if(typeof success === 'undefined') {
							//没有传入函数
							return;
						}
						if(typeof success === 'function') {
							res = JSON.parse(xhr.response);
							success(res);
						}else {
							throw new Error('success is not a function');
						}
					}
					if(typeof complete === 'undefined') {
						//没有传入函数
						return;
					}
					if(typeof complete === 'function') {
						res = xhr.response;
						complete(res);
					}else {
						throw new Error('complete is not a function or undefined');
					}
				}
			}
			xhr.send(data);
		},
		Get:function(url, data) {
			//建造者模式
			if(typeof url != 'string') {
				throw new Error('request url is undefined');
			}
			var res = {},
				props = [],
				data = data || {};
			for(var prop in data) {
				props.push(prop + '=' + data[prop]);
			}
			props = props.join('&');
			props = props == [] ? '' : '?' + props;
			xhr.open('get', url + props, async);
			xhr.setRequestHeader('dataType', dataType);
			xhr.send(null);
			return this;
		},
		Post:function(url, data) {
			//建造者模式
			if(typeof url != 'string') {
				throw new Error('request url is undefined');
			}
			var res = {},
				data = JSON.stringify(data) || {};
			xhr.open('post', url, async);
			xhr.setRequestHeader('dataType', dataType);
			xhr.send(data);
			return this;
		},
		done: function(fn) {
			//如果请求成功，直接返回成功的数据，如果没有成功，返回服务器返回的数据
			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
						res = JSON.parse(xhr.response);
						if(typeof fn === 'undefined') {
							return;
						}
						if(typeof fn === 'function') {
							fn(res);
							return;
						}else {
							throw new Error('the param is not a function');
							return;
						}
					}else {
						res = xhr.response;
						if(typeof fn === 'undefined') {
							return;
						}
						if(typeof fn === 'function') {
							fn(res);
							return;
						}else {
							throw new Error('the param is not a function');
							return;
						}
					}
				}
			}
		}
	};
	//设置为全局对象
	window.ajax = ajax;
	//返回模块名称
	return ajax;
})

/*
建造者模式：Get/Post/done
成功函数和完成函数公用一个函数，
传入的参数data可以为空，成功和完成的回调函数可以为空，但是请求的地址不可以为空


普通回调：get/post
传入的参数data可以为空，请求的地址不可以为空,done可以调用一个空函数，也可以不调用done函数
done函数：
如果请求成功，返回请求成功的数据，
如果请求失败，返回请求完成的数据,失败的信息可以在请求完成的返回数据里面提取出来

可以用require导入模块，也可以用过js直接引入，无需依赖jquery
*/