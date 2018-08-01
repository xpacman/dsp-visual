# Visualized signal processing using ReactJs & Konva

Based on [React](https://facebook.github.io/react/) & [Konva](https://github.com/konvajs/react-konva).

- [x] Linear regression and least squares method
- [x] Interpolation and signal reconstruction from samples
- [x] Discrete convolution
- [x] Discrete cross correlation

## Demo
http://dsp.titandesign.eu (Czech language)

## Running locally

Ensure you have Node installed, then;

	git clone https://github.com/xpacman/dsp-visual
	
Install node modules

	npm install
	
Start the server

	npm start
	// Or for Webpack Dashboard
	npm run dev
	
Open your browser to `http://localhost:8111`. You can change the hostname and port by editing the values in the `.env` file.

## Production build

To build production ready assets, simply run:

	npm run build
	
This will build a uglified `app-[hash].js` and a minified `app-[hash].css` and automatically create a `index.html` linking these files for you in a `build/` directory.

The `build/` directory is `.gitignore`'d by default, and purged before every build.

## Available commands

- `npm start` - start the dev server
- `npm run clean` - delete the `build` folder
- `npm run lint` - run a eslint check
- `npm test` - run all tests
- `npm run dev` - start the dev server using webpack dashboard
- `npm run build` - create a production ready build in the `build` folder
