# Opengram

Opengram started as a POC of Instagram main functionalities using node.js, but evolved to its own thing. Currently, it's a photo manager that allows the user to “upload” and organize photos and albums using the browser.

To check the front-end, access [Opengram Front](https://github.com/GracieleDamasceno/opengram-front).

## Installation

### Running locally through Docker
First, execute the following commands at the root of [Opengram](https://github.com/GracieleDamasceno/opengram) local folder:

```
docker build . -t opengram
docker-compose up -d 
```

With the project up and running, execute the following commands at the root of [Opengram Front](https://github.com/GracieleDamasceno/opengram-front) local folder:
```
docker build . -t opengram-front
docker-compose up -d
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.


## License

[MIT](https://choosealicense.com/licenses/mit/)