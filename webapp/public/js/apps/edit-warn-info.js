require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
	var user = sessionStorage.getItem('user');
	user = fly.evalJSON(user);
	var $dialogEdit = top.fly.dialog.list['dialogEdit'],
		itemId = $dialogEdit.options.itemId,
		vm = window.vm = fly.observable({
			item: {},
			optionType: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/dictionary/getOptionType',
					dataType: 'json',
					type: 'GET',
					dataFilter: function(res) {
						var res = fly.evalJSON(res);
						if (res.length > 0) {
							return JSON.stringify(res);
						} else {
							fly.alert('操作类型数据请求失败');
						}
					}
				}
			}),
			businessSystem: fly.dataSource({
				read: {
					url: 'http://localhost:8080/audit-backend/dictionary/getBusinessSystem',
					dataType: 'json',
					type: 'GET',
					dataFilter: function(res) {
						var res = fly.evalJSON(res);
						if (res.length > 0) {
							return JSON.stringify(res);
						} else {
							fly.alert('业务系统数据请求失败');
						}
					}
				}
			}),
			cancelClick: function(e) {
				var $dialogEdit = top.fly.dialog.list['dialogEdit'];
				$dialogEdit.close().destroy();
			},
			editClick: function(e) {
				var $form = $('#formWrap').flyForm({
						valid: {
							theme: {
								required: true,
								title: '主题',
								check: function(e) {
									var val = this.val();
									if (val.length > 20) {
										this.flyTooltip({
											content: '主题最长不超过20个字符'
										});
										return false;
									}
									return val;
								}
							},
							warnTime: {
								required: true,
								title: '预警时间'
							},
							exceptionValue: {
								required: true,
								type: 'number',
								min: 1,
								max: 100,
								step: 1,
								title: '异常情况'
							},
							businessSystem: {
								required: true,
								title: '业务系统'
							},
							optionType: {
								required: true,
								title: '操作类型'
							}
						}
					}),
					$dialogEdit = top.fly.dialog.list['dialogEdit'];
				data = $form.data('flyForm').data();
				if (!data) {
					return false;
				}
				data.modifyUserId = user.id;
				data.id = itemId;
				$.ajax({
					type: "POST",
					url: "http://localhost:8080/audit-backend/listWarn/updateListWarn",
					contentType: 'application/json',
					dataType: 'json',
					data: JSON.stringify(data),
					success: function(res) {
						if (res.code == '1') {
							$dialogEdit.trigger('refresh');
							$dialogEdit.close().destroy();
						} else {
							fly.alert("数据编辑失败");
						}
					}
				});
			}
		});
	fly.bind('body', vm);
	$.ajax({
		type: "GET",
		url: "http://localhost:8080/audit-backend/listWarn/getListWarnById",
		data: {
			listWarnId: itemId
		},
		success: function(res) {
			var res = fly.evalJSON(res);
			res.warnTime = formatDate(res.warnTime, 'yyyy-MM-dd hh:mm:ss');
			vm.set('item', res);
		}
	});

	function formatDate(e, format) {
		//e为不满足格式的日期，format为格式
		date = new Date(e);
		var map = {
			"M": date.getMonth() + 1, //月份
			"d": date.getDate(), //日
			"h": date.getHours(), //小时
			"m": date.getMinutes(), //分
			"s": date.getSeconds() //秒
		};
		format = format.replace(/([yMdhmsqS])+/g, function(all, t) {
			var v = map[t];
			if (v !== undefined) {
				if (all.length > 1) {
					v = '0' + v;
					v = v.substr(v.length - 2);
				}
				return v;
			} else if (t === 'y') {
				return (date.getFullYear() + '').substr(4 - all.length);
			}
			return all;
		});
		return format;
	}
});