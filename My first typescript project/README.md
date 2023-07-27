# Simple TS calculator (Snowpack)

To run: npm start

## Features
"# section" and "## subsection" support.<br>
"/ js code" to evaluate raw js.<br>
Write any function such as "f(x)=x^2" or just "x^2" to have it show up in the graph viewer.<br>
Evaluate any function with "f(2)". Built-in functions include: "nCr","lg(x)","lg(x,base)","fac(x)" and basic math functions like sin etc.<br>
If the entered text can not be evaluated, it will be written in the log as a comment.<br>
Double-click to add a point on the screen, or drag to create a vector. <br>
<br>
Points are written in (), vectors in [] and matrices in [[]]. Vectors and matrices support iterative notation; [i](3) becomes [0,1,2], [[i+j]](1,2) becomes [[0,1]].<br>
Data can be opened with ctrl+o or the upload button in the navbar. Supported data thus far includes only csv. If the file is recognized as a yfinance file, it will be displayed in candles.<br>
RM+drag to select everything inside a rectangle, or ctrl+a to select everything.<br>
ctrl+f to fit a line to the selection, or write linreg(...objects) in the console. Support for fitting polynomials is coming.<br>
shift+scroll to "pinch" the x axis.<br>

<img src="react calc preview.png">
