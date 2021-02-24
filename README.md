# DataBase
JSON-подобная библиотека для создания и управления локальной базой данных

# API
### Подключение в основном файле

#### Импорт библиотеки:
```js
const DataBase = require('./db.js');
```
#### Создание объекта библиотеки:
```js
const db = new DataBase('dataBase');
//При отсутствии директории, она создастся
//Название директории необязательно, по умолчанию присвоится 'dataBase'
```
### Основные функции

#### Добавление данных в таблицу:
##### db.put(tableName, data)
```js
db.put('users', {name: 'John'});
//Если таблица не существует, она создастся
```

#### Поиск по таблице:
##### db.findOne(tableName, condition)
```js
db.findOne('users', {name: 'John'});
//Также можно использовать стрелочные функции для более сложных выражений
db.findOne('users', (i) => i.name === 'John');
```

##### db.find(tableName, condition[, quantity])
```js
db.find('users', {name: 'John'});
//или
db.find('users', (i) => i.name === 'John');
```

#### Редактирование данных в таблице:
##### db.edit(objects, newData)
```js
let findUsers = db.find('users', {name: 'John', birthday: '01.01.1970'});
db.edit(findUsers, {pension: true});
```
Функция имеет возможность редактирования множества элементов разных таблиц
```js
let findUsers = db.find('users', {name: 'John', birthday: '01.01.1970'});
let findCars = db.find('cars', (i) => i.ownerName != 'John' && i.releasedYear >= 1970);
db.edit([findUsers, findCars], {priority: 1});
```
##### db.set(objects, data)

В отличие от edit, полностью заменяет элемент
```js
let user = db.findOne('users', {name: 'John'}); //{name: 'John', birthday: '01.01.1970', pension: true}
db.edit(user, {name: 'Mike'}); //{name: 'Mike', birthday: '01.01.1970', pension: true}
db.set(user, {name: 'Mike'}); //{name: 'Mike'}
```

> Особенностью edit является редактирование данных не только в таблице, но и в объекте. Это позволяет использовать найденный объект в дальнейшем с учетом измененных данных.

#### Удаление данных из таблицы
##### db.delete(objects)
```js
let users = db.find('users', {name: 'John', birthday: '01.01.1970'});
let cars = db.find('cars', {ownerName: 'John'});
db.delete(users);
//или
db.delete([users, cars]);
```

### Дополнительные функции

#### Удаление таблицы
##### db.wipe(...tablesNames)
```js
db.wipe('users', 'cars')
```

#### Полная очистка базы данных
```js
db.nuke()
```

#### Создание таблицы
```js
db.createTable('users')
```

#### Переименование таблицы
##### db.rename(tableNameFrom, tableNameTo)
```js
db.rename('users', 'authorizedUsers')
```
