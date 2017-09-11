require.config(requireConfig);
require(['jquery', 'fly', 'siglesel'], function($, fly) {
	var user = sessionStorage.getItem("user");
	user = fly.evalJSON(user);
	var vm = window.vm = fly.observable({
		theme: '',
		sigleselVal: '',
		periods: fly.dataSource({
			read: {
				url: 'http://localhost:8080/audit-backend/dictionary/getStatisCycle',
				dataType: 'json',
				type: 'GET',
				dataFilter: function(res) {
					var res = fly.evalJSON(res);
					if (res.length > 0) {
						return JSON.stringify(res);
					} else {
						fly.alert('统计周期数据请求失败');
					}
				}
			}
		}),
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
		system: fly.dataSource({
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
		saveClick: function(e) {
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
					dataRange: {
						required: true,
						title: '数据范围',
						type: 'number',
						min: 20,
						step: 1
					}
				}
			}),
			period = vm.sigleselVal,
			recordFlag = $('#lastPeroid').prop('checked'),
			maxRecordFlag = $('#maxRecord').prop('checked');
			data = $form.data('flyForm').data();
			if (!data) {
				return false;
			}
			data.period = period;
			data.record = '';
			if (recordFlag && data.lastPeroid) {
				data.record = parseInt(data.lastPeroid);
				if (data.record && data.record < 0) {
					$('#lastPeroid').flyTooltip({
						content: '请输入有效数字'
					});
					return false;
				}
			} else if (maxRecordFlag && data.maxRecord) {
				data.record = parseInt(data.maxRecord);
				if (data.record && data.record < 0) {
					$('#maxRecord').flyTooltip({
						content: '请输入有效数字'
					});
					return false;
				}
			}
			//删除没用的属性
			delete data['lastPeroid'];
			delete data['maxRecord'];
			delete data['thresholdRecord'];
			if (data.record) {
				data.statisType = '4001';
				data.statisValue = data.record;
			}
			if (data.lastPeroid) {
				data.statisType = '4002';
				data.statisValue = data.lastPeroid;
			}
			data.createUser = user.userName;
			var sigleselVal = vm.get('sigleselVal');
			if (sigleselVal) {
				data.statisCycle = sigleselVal;
			}
			$.ajax({
				type: "POST",
				url: "http://localhost:8080/audit-backend/frequency/addFrequency",
				contentType: 'application/json',
				dataType: 'json',
				data: JSON.stringify(data),
				success: function(res) {
					if (res.code == '1') {
						fly.alert('数据添加成功');
						setTimeout(function() {
							window.location.reload();
						},1000);
					} else {
						fly.alert('数据添加失败');
					}
				}
			});
		},
		cancelClick: function(e) {
			top.fly.dialog({
				title: '数据清空',
				content: '取消后清空所有数据，是否取消？',
				width: '300px',
				height: '50px',
				padding: '25px',
				backdropOpacity: 0.3,
				okValue: '确定',
				ok: function() {
					//刷新当前那页面，重置所有数据
					window.location.href = '/views/frequency-config.html';
				},
				cancelValue: '取消',
				cancel: function() {}
			});
		}
	});
	fly.bind('body', vm);
});