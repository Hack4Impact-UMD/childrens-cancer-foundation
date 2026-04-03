import logo from "../../assets/ccf-logo.png";
import "./Header.css";

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps): JSX.Element {
  return (
    <div className="dashboard-header-container">
      <img src={logo} className="dashboard-logo" alt="logo" />
      <h1 className="dashboard-header">{title}</h1>
    </div>
  );
}

export default Header;