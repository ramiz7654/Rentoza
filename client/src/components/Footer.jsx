import { Link } from 'react-router-dom';
import '../home-extras.css';

export default function Footer() {
  return (
    <footer className="ft">
      <div className="ft-in">
        <div className="ft-about">
          <span className="brand">Rentoza</span>
          <p>Rentoza connects riders with verified local rental shops. Compare scooters, bikes and cars, book your dates and pick up from a shop near you.</p>
        </div>
        <div><h4>Explore</h4>
          <Link to="/home">Home</Link><Link to="/category/scooty">Scooty</Link><Link to="/category/bike">Bike</Link><Link to="/category/car">Car</Link><Link to="/category/suv">SUV</Link>
        </div>
        <div><h4>Your account</h4>
          <Link to="/bookings">My Bookings</Link><Link to="/profile">Profile</Link><Link to="/support">Help &amp; Support</Link>
        </div>
      </div>
      <div className="ft-bar">&copy; {new Date().getFullYear()} Rentoza. All rights reserved. Rent. Ride. Explore.</div>
    </footer>
  );
}
