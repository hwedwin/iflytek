package com.iflytek.audit.common;

import java.util.List;

import com.alibaba.fastjson.JSONObject;

/**
 * 分页
 * 
 * @history:
 * @version: v1.0
 * @param <T>
 */
public class PageVo<T> {
	
	/**
	 * 默认当前页
	 */
	private int currentPageNo = 1;

	/**
	 * 每页大小
	 */
	private int pageSize = 5;
	
	/**
	 * 查询的结果总数
	 */
	private long total;
	
	/**
	 * 每页的分页数据
	 */
	private List<T> rows;

	public PageVo() {}

	public int getStartResult() {
		return (this.currentPageNo - 1) * this.pageSize;
	}
	
	public int getEndResult() {
		return this.pageSize;
	}

	public int getCurrentPageNo() {
		return currentPageNo;
	}

	public void setCurrentPageNo(int currentPageNo) {
		this.currentPageNo = currentPageNo;
	}

	/**
	 * @return the pageSize
	 */
	public int getPageSize() {
		return pageSize;
	}

	/**
	 * @param pageSize
	 *            the pageSize to set
	 */
	public void setPageSize(int pageSize) {
		this.pageSize = pageSize;
	}

	/**
	 * @return the total
	 */
	public long getTotal() {
		return total;
	}

	/**
	 * @param total
	 *            the total to set
	 */
	public void setTotal(long total) {
		this.total = total;
	}

	/**
	 * @return the rows
	 */
	public List<T> getRows() {
		return rows;
	}

	/**
	 * @param rows
	 *            the rows to set
	 */
	public void setRows(List<T> rows) {
		this.rows = rows;
	}

	@Override
	public String toString() {
		return JSONObject.toJSONString(this);
	}

}
