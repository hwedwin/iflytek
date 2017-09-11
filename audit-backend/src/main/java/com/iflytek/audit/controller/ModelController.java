package com.iflytek.audit.controller;

import java.util.List;

import org.apache.commons.lang3.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.alibaba.fastjson.JSON;
import com.iflytek.audit.common.MessageDto;
import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.entity.Model;
import com.iflytek.audit.service.ModelService;

/**
 * 
* @ClassName: ModelController 
* @Description: 模型控制层 
* @author 曹庭旺 
* @date 2017年9月6日 下午3:30:58 
*
 */
@Controller
@RequestMapping(value = "model")
public class ModelController {
	@Autowired
	private ModelService modelService;
	
	/**
	 * 获取模型分页列表
	* @method: getModelList
	* @param:model分页的模型条件，分页信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getModelList")
	public String getModelList(Model model, PageVo<Model> page) {
		return JSON.toJSONString(modelService.getModelByPage(model, page));
	}
	
	/**
	 * 添加模型
	* @method: addModel
	* @param:model：要添加的模型信息
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "addModel")
	public String addModel(Model model) {
		model = modelService.addModel(model);
		MessageDto<Model> dto = new MessageDto<Model>();
		if (!ObjectUtils.notEqual(model, null)) {
			dto.setCode("0");
			dto.setMsg("数据添加失败");
		} else {
			dto.setCode("1");
			dto.setMsg("数据添加成功");
			dto.setData(model);
		}
		return JSON.toJSONString(dto);
	}
	
	/**
	 * 删除模型
	* @method: deleteModel
	* @param:模型的id
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "deleteModelById")
	public String deleteModelById(Integer modelId) {
		return JSON.toJSONString(modelService.deleteModel(modelId));
	}
	
	/**
	 * 根据
	* @method: getRemindWay
	* @param:
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "getRemindWay")
	public String getRemindWay(PageVo<Model> page) {
		return JSON.toJSONString(modelService.getRemindWay(page));
	}
	
	/**
	 * 修改用户的提醒方式
	* @method: updateRemindWay
	* @param:createUserId：提醒的用户id，type：存放前端传过来的提醒方式
	* @return String
	 */
	@ResponseBody
	@RequestMapping(value = "updateRemindWay")
	public String updateRemindWay(@RequestBody List<Model> models) {
		Boolean flag = modelService.updateRemindWay(models);
		MessageDto<Model> dto = new MessageDto<Model>();
		if (!flag) {
			dto.setCode("0");
			dto.setMsg("数据添加失败");
		} else {
			dto.setCode("1");
			dto.setMsg("数据添加成功");
		}
		return JSON.toJSONString(dto);
	}
}
