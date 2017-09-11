require.config(requireConfig);
require(['jquery', 'fly', 'networkUtil'], function($, fly, net) {
	var vm = window.vm = fly.observable({
		allSelected: false,
		smsVal: '5001',
		emailVal: '5002',
		tableData: fly.dataSource({
			read: {
				url: 'http://localhost:8080/audit-backend/model/getRemindWay',
				type: 'POST',
				dataType: 'json',
				dataFilter: function(res) {
					var res = fly.evalJSON(res),
						data = {
							rows: res.rows || [],
							total: res.total || 0
						};
					res.rows.forEach(function(item, i) {
						var str = item.remindWay;
						var emailFlag = str.indexOf('5001') == -1 ? false : true;
						var phoneFlag = str.indexOf('5002') == -1 ? false : true;
						item.email = emailFlag;
						item.phone = phoneFlag;
					});
					if (data.rows.length <= 0) {
						$('#gridList').html('<tr><td colspan="9">暂无数据</td></tr>');
					}
					//防止在全选的情况下选择页码后，全选还是被选中状态
					vm.set('allSelected', false);
					return JSON.stringify(data);
				}
			},
			pageSize: 5
		}).bind('change', function(e) {
			var allChecked = true;
			if (e.field === 'checked') {
				this.view().forEach(function(item) {
					if (!item.checked) allChecked = false;
				});
				vm.set('allSelected', allChecked);
			}
		}),
		selectAll: function(e) {
			$.each(this.tableData.view(), function() {
				this.set('checked', e.target.checked);
			});
		},
		selectItem: function(e) {
			var item = e.handleObj.data;
			item.set('checked', true);
		},
		saveClick: function(e) {
			//todo 逻辑待验证
			var temp = {},
				data = [];
			$.each(this.tableData.view(), function() {
				if (!this.checked) {
					return;
				}
				var $sms = $('#' + this.createUserId).find('input[name=smsChecked]'),
					$email = $('#' + this.createUserId).find('input[name=emailChecked]'),
					smsFlag = $sms.attr('checked'),
					emailFlag = $email.attr('checked'),
					remindWay = [];
				if (smsFlag) {
					remindWay.push($sms.val());
				}
				if (emailFlag) {
					remindWay.push($email.val());
				}
				temp = {
					createUserId: this.createUserId,
					remindWay: remindWay.toString()
				};
				//当翻页的时候，为了防止选中的信息清空，将数据放在全局变量中
				data.push(temp);
				temp = {};
			});
			if (data.length <= 0) {
				fly.alert({
					content: '请选择要保存的数据',
					css: 'info'
				});
				return;
			}
			$.ajax({
				type: "POST",
				url: "http://localhost:8080/audit-backend/model/updateRemindWay",
				dataType:"json",
                contentType:"application/json",
				data: JSON.stringify(data),
				success: function(res) {
					fly.alert('修改成功');
					vm.tableData.page(1);
				}
			});
		}
	});
	fly.bind('body', vm);
});