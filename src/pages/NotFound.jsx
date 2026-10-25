import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="empty-state-icon" style={{ margin: "0 auto 16px" }}>
        <Icon name="alert" size={22} />
      </div>
      <p className="eyebrow">404</p>
      <h1 className="page-title">This page doesn't exist</h1>
      <p className="page-sub" style={{ margin: "0 auto 20px" }}>
        Check the link, or head back to the homepage.
      </p>
      <Link to="/" className="btn btn-amber">
        Back home
      </Link>
    </div>
  );
}
