import { notFound } from "next/navigation";
import { ListArticleScreen } from "@/components/apps/ListArticleScreen";
import { getListArticle, listArticles } from "@/data/mock/list-articles";

interface ListArticlePageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return listArticles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: ListArticlePageProps) {
  const article = getListArticle(params.slug);
  if (!article) {
    return {
      title: "List not found",
    };
  }
  return {
    title: `${article.title} · Mirch`,
    description: article.intro,
  };
}

export default function ListArticlePage({ params }: ListArticlePageProps) {
  const article = getListArticle(params.slug);

  if (!article) {
    notFound();
  }

  return <ListArticleScreen article={article} />;
}
