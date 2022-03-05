# Pool Party Website


## Installation

Install jekyll from: https://jekyllrb.com/docs/installation/ubuntu/

```

sudo apt-get install ruby-full build-essential zlib1g-dev

echo '# Install Ruby Gems to ~/gems' >> ~/.bashrc
echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

gem install jekyll bundler

```

Install the project:

```
bundle install
```

## Run

```bash
./start_web.sh
```

Open in localhost:4000