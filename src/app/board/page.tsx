// 看板页：按投递漏斗状态把 mock 记录分成 6 列展示。
// 本阶段为静态布局：不接真实接口、不做拖拽
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import {
  mockApplications,
  type Application,
  type ApplicationStatus,
} from "@/mocks/applications";

// 看板列配置：把 mock 里细分的面试轮次（一面/二面/三面/HR 面）归并到“面试中”一列。
// key：列表渲染用的唯一标识；title：列头展示文案；statuses：该列收录的投递状态。
const COLUMNS: {
  key: string;
  title: string;
  statuses: ApplicationStatus[];
}[] = [
  { key: "wishlist", title: "意向", statuses: ["wishlist"] },
  { key: "applied", title: "已投递", statuses: ["applied"] },
  { key: "written", title: "笔试/测评", statuses: ["written"] },
  {
    key: "interview",
    title: "面试中",
    statuses: ["interview_1", "interview_2", "interview_3", "hr"],
  },
  { key: "offer", title: "Offer", statuses: ["offer"] },
  { key: "rejected", title: "未通过", statuses: ["rejected"] },
];

export default function BoardPage() {
  // 按列配置对 mock 分组：每列过滤出属于自身状态的投递记录
  const columns = COLUMNS.map((col) => ({
    ...col,
    items: mockApplications.filter((app) =>
      col.statuses.includes(app.status)
    ),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      {/* 页面标题区 */}
      <header className="mb-6">
        <h1 className="text-xl font-semibold">投递看板</h1>
        <p className="text-sm text-muted-foreground">
          按投递进度跟踪校招机会（当前为 mock 数据）
        </p>
      </header>

      {/* 列容器：窄屏单列纵向堆叠，桌面两列/三列网格，保证 375px 不出现横向滚动 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {columns.map((col) => (
          <section key={col.key} className="flex flex-col gap-3">
            {/* 列头：标题 + 当前卡片数量 */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-medium">{col.title}</h2>
              <span className="text-xs text-muted-foreground">
                {col.items.length}
              </span>
            </div>

            {/* 列内卡片列表 */}
            <div className="flex flex-col gap-3">
              {col.items.map((app: Application) => (
                <Card key={app.id}>
                  <CardHeader>
                    {/* 公司名作为卡片主标题，岗位作为副标题 */}
                    <CardTitle>{app.company}</CardTitle>
                    <CardDescription>{app.position}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">渠道：{app.channel}</span>
                    {app.deadline && (
                      <span className="text-muted-foreground">截止：{app.deadline}</span>
                    )}
                    {app.notes && <span className="text-xs">{app.notes}</span>}
                  </CardContent>
                </Card>
              ))}

              {/* 空列占位：保持列结构稳定，后续补数据/拖拽时不用改布局 */}
              {col.items.length === 0 && (
                <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  暂无投递
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
