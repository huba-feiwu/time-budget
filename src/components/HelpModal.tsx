interface Props {
  onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <h3>使用说明</h3>
        <p className="help-desc">每天 24 小时预算，记录时间去向，没用完的自动留给明天。</p>

        <h4>如何记录时间</h4>
        <ul>
          <li><b>计时器</b>：选类别 -&gt; 开始 -&gt; 停止，自动生成一条记录</li>
          <li><b>手动添加</b>：点击 &ldquo;+ 添加&rdquo;，填写时长和备注</li>
        </ul>

        <h4>界面说明</h4>
        <ul>
          <li><b>左侧</b>：今日预算 + 计时器 + 各类用时汇总</li>
          <li><b>右侧</b>：日历 + 记录列表</li>
          <li>有记录的日子，日历上会显示绿点</li>
        </ul>

        <h4>统计</h4>

        <h4>设置</h4>
        <ul>
          <li><b>日起始</b>：调整一天的起点（适合熬夜党）</li>
          <li><b>睡眠占比</b>：开关睡觉是否参与百分比计算</li>
          <li><b>暗色模式 / 关闭到托盘</b></li>
          <li><b>导出/导入</b>：备份或迁移数据</li>
        </ul>

        <div className="form-actions">
          <button className="btn btn-save" onClick={onClose}>知道了</button>
        </div>
      </div>
    </div>
  );
}
