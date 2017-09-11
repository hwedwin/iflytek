package com.iflytek.audit.controller;

import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.iflytek.audit.common.MessageDto;
import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.entity.ListWarn;
import com.iflytek.audit.service.ListWarnService;

/**
 * 
* @ClassName: ListWarnController 
* @Description: 名单预警控制层
* @author 曹庭旺 
* @date 2017年9月6日 下午2:48:35 
*
 */
@Controller
@RequestMapping(value = "listWarn")
public class ListWarnController {

	@Autowired
	ListWarnService listWarnService;
	
	/**
	 * 
	* @method: addListWarn
	* @param:ListWarn:要新增的名单预警的信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "addListWarn")
	public String addListWarn(@RequestBody ListWarn listWarn) {
		listWarn = listWarnService.addListWarn(listWarn);
		MessageDto<ListWarn> dto = new MessageDto<ListWarn>();
		if (!ObjectUtils.notEqual(listWarn, null)) {
			dto.setCode("0");
			dto.setMsg("信息添加失败");
		} else {
			dto.setCode("1");
			dto.setMsg("信息添加成功");
			dto.setData(listWarn);
		}
		return JSON.toJSONString(dto);
	}

	/**
	 * 条件查询分页
	* @method: getListWarn
	* @param:listWarn:要查询的条件，page：分页信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getListWarn")
	public String getListWarn(ListWarn listWarn, PageVo<ListWarn> page) {
		return JSON.toJSONString(listWarnService.getListWarn(listWarn, page));
	}

	/**
	 * 删除名单预警信息
	* @method: deleteListWarn
	* @param:ids：要删除的名单预警的id，可能是多个，传的值为数组
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "deleteListWarn")
	public String deleteListWarn(@RequestParam(value = "ids[]") int[] ids) {
		MessageDto<ListWarn> dto = new MessageDto<ListWarn>();
		Boolean flag = listWarnService.deleteListWarn(ids);
		if(flag) {
			dto.setCode("1");
			dto.setMsg("成功删除");
		} else {
			dto.setCode("0");
			dto.setMsg("删除失败");
			dto.setData(null);
		}
		return JSON.toJSONString(dto);
	}

	/**
	 * 根据id查找名单已经信息
	* @method: getListWarnById
	* @param:listWarnId:要获取的名单预警的信息的id
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getListWarnById")
	public String getListWarnById(Integer listWarnId) {
		return JSON.toJSONString(listWarnService.getListWarnById(listWarnId));
	}

	/**
	 * 更新预警信息
	* @method: updateListWarn
	* @param:listWarn:修改之后的名单预警的信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "updateListWarn")
	public String updateListWarn(@RequestBody ListWarn listWarn) {
		MessageDto<ListWarn> dto = new MessageDto<ListWarn>();
		Boolean flag = listWarnService.updateListWarn(listWarn);
		if(flag) {
			dto.setCode("1");
			dto.setMsg("数据修改成功");
			dto.setData(listWarn);
		} else {
			dto.setCode("0");
			dto.setMsg("数据修改失败");
			dto.setData(null);
		}
		return JSON.toJSONString(dto);
	}
}
