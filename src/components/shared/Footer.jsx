import React, { Component } from "react";

class Footer extends Component {
  render() {
    return (
      <div className="text-center mt-16">
        <p className="text-gray-400 text-sm">
          Built with ✨ by Afton Gauntlett • {""}
          <a
            href="https://aftongauntlett.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline transition-colors duration-200"
          >
            View Portfolio
          </a>
        </p>
      </div>
    );
  }
}

export default Footer;
