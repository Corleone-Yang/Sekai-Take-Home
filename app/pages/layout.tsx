export const metadata = {
  title: "Pages",
  description: "Application pages",
};

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="pages-container">{children}</div>;
}
