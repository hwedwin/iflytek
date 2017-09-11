require.config(requireConfig);
require(['jquery', 'fly'], function ($, fly) {
	var user = sessionStorage.getItem("user");
	user = fly.evalJSON(user);
	var vm = window.vm = fly.observable({
		nickName: user.nickName,
		menus: fly.nodeDataSource({
			read: {
				url: '/public/mock/menu.json',
				dataType: 'json',
				type: 'GET',
				dataFilter: function(res) {
					var res = fly.evalJSON(res);
					if(res.flag) {
						res = treeChildren(res.result,'名单预警');
						return JSON.stringify(res);
					}else {
						fly.alert(res.msg);
					}
				}
			},
			model: {
				children: 'categories'
			}
		}),
		logout: function() {
			window.location.href = "/views/login.html";
		}
	});
	fly.bind('body',vm);
	//展开全部
	var treeChildren = function(data, text) {
		for (var i = 0; i < data.length; i++) {
			data[i].expanded = true;
			//将一级节点设置为不可用状态，一级节点：有子节点
			//将没有页面的节点设置为不可点击状态
			if(data[i].categories || data[i].value == 'javascript:void(null)') {
				data[i].enabled = false;
			}
			// 选中
			if (data[i].text === text) {
				data[i].selected = true;
			}
			if (data[i].categories && data[i].categories.length) {
				treeChildren(data[i].categories, text);
			}
		};
		return data;
	}
});