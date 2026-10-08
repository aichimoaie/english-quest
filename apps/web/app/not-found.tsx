import Link from "next/link";

export default function NotFound() {
  return (
    <div className="stack">
      <h1 className="t-title">Page not found</h1>
      <p className="t-body">That page is not part of the course.</p>
      <Link className="btn btn-primary btn-block" href="/course">
        Go to my course
      </Link>
    </div>
  );
}
