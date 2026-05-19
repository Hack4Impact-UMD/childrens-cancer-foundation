import logo from "../../assets/ccf-logo.png";
import "./Header.css";

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps): JSX.Element {
  return (
    <div className="ccf-dashboard-banner">
      <img src={logo} className="ccf-dashboard-banner-logo" alt="CCF logo" />
      <h1 className="ccf-dashboard-banner-title">{title}</h1>
    </div>
  );
}

export default Header;
