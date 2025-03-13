# Installation Guide for ZeroBid (Linux & macOS)

## Prerequisites
Ensure you have the following dependencies installed before proceeding:

### 1. Install Rust
```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Install Python
Install Python using your package manager:

**macOS (Homebrew):**
```sh
brew install python3
```

**Linux (Debian-based):**
```sh
sudo apt update && sudo apt install python3 python3-pip -y
```

**Linux (Arch-based):**
```sh
sudo pacman -S python python-pip
```

### 3. Install Node.js
**Using nvm (recommended):**
```sh
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
source ~/.bashrc  # or source ~/.zshrc if using zsh
nvm install --lts
```

**Alternative (macOS - Homebrew):**
```sh
brew install node
```

**Alternative (Linux - Debian-based):**
```sh
sudo apt install nodejs npm
```

### 4. Install Risc0
```sh
curl -L https://risczero.com/install | bash
rzup install cargo-risczero v1.2.2
```

---

## Project Setup

### 1. Clone the Repository
```sh
git clone https://vcs.ap.runi.ac.il/applied-crypto/project-ZeroBid/
cd project-ZeroBid
```

### 2. Install Node.js Dependencies
```sh
npm install
```

### 3. Start Bank Server
```sh
cd bank_server
pip install -r requirements.txt
maturin develop
python app.py
```

### 4. Start Auction Server
Open a **new terminal** and run:
```sh
cd auction_server
pip install -r requirements.txt
cd verifier
maturin develop
cd ..
python app.py
```

### 5. Start Tauri App
Open another **new terminal** and run:
```sh
npx tauri dev
```
Your project should now be running successfully!

## Troubleshooting

### Array Synchronization Issue

If you notice that the array output in the terminal when running the application doesn't match the array stored in `auction_server/guest_id.json`, you need to manually synchronize them:

1. Check the array displayed in the terminal output
2. Open the `auction_server/guest_id.json` file
3. Update the contents of the JSON file to match exactly what's shown in the terminal output
4. Save the file

This synchronization is important to maintain data consistency across the application. Mismatches between these arrays can cause unexpected behavior, including authentication issues and incorrect data association.

This ensures that all registered guest IDs are properly tracked by the application.


