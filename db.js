const fs = require('fs');

module.exports = class DataBase {
  constructor(dir) {
    this.__dirname = dir || 'dataBase';
    this.__dir = `./${this.__dirname}`;
    this.__folder = this.__dir + '/';
    this.__date = new Date();
    this.extension = '.json';
    this.tables = [];

    this.__init();
  }

  error(d, f) {
    console.error(`DataBase:: ERROR in ${f} \n ${d}`);
  }

  getDate() {
    let date = this.__date
        .toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .split('-')
        .reverse()
        .join('.'),
      time = this.__date.toLocaleTimeString('ru-RU');
    return `${date} ${time}`;
  }

  generateHash() {
    let str = parseInt(Date.now() + Math.random() * 1000000);
    return str.toString(16);
  }

  __init() {
    try {
      if (!fs.existsSync(this.__dir)) fs.mkdirSync(this.__folder);
      this.tables = fs.readdirSync(this.__dir);
    } catch (e) {
      this.error(e, 'init');
    }
  }

  findTable(table) {
    return this.tables.find((i) => i == table + this.extension);
  }

  readTable(table) {
    try {
      return JSON.parse(
        fs.readFileSync(this.__folder + table + this.extension, 'utf8')
      );
    } catch (e) {
      this.error(e, 'readTable');
    }
  }

  createTable(table) {
    if (this.findTable(table))
      this.error('file already created', 'createTable');
    else {
      try {
        fs.openSync(this.__folder + table + this.extension, 'w+');
        this.tables.push(table + this.extension);
        let tableData = {
          __createdAt: this.getDate(),
          __updatedAt: this.getDate(),
          __totalId: 0,
          table: [],
        };
        this.write(table, tableData);
      } catch (e) {
        this.error(e, 'createTable');
      }
    }
  }

  wipe(...tables) {
    try {
      console.log(tables);
      for (let table of tables) {
        fs.unlinkSync(this.__folder + table + this.extension);
        let index = this.tables.indexOf(table);
        this.tables.splice(index, 1);
      }
    } catch (e) {
      this.error(e, 'wipe');
    }
  }

  nuke() {
    try {
      fs.rmdirSync(this.__dir, { recursive: true });
      fs.mkdirSync(this.__dir, { recursive: true });
    } catch (e) {
      this.error(e, 'nuke');
    }
  }

  rename(from, to) {
    if (!this.tables.find((i) => i == from + this.extension)) {
      this.error('file does not exist', 'rename');
    } else {
      try {
        fs.renameSync(
          this.__folder + from + this.extension,
          this.__folder + to + this.extension
        );
        this.tables.map((i) => (i == from ? to : i));
      } catch (e) {
        this.error(e, 'rename');
      }
    }
  }

  write(table, data) {
    if (!this.tables.find((i) => i == table + this.extension)) {
      this.createTable(table);
    }
    try {
      fs.writeFileSync(
        this.__folder + table + this.extension,
        JSON.stringify(data)
      );
    } catch (e) {
      this.error(e, 'write');
    }
  }

  put(table, data) {
    if (!this.findTable(table)) {
      this.createTable(table);
    }
    try {
      let file = this.readTable(table);
      file.__updatedAt = this.getDate();
      data.__id = this.generateHash();
      file.__totalId++;
      data.id = file.__totalId;
      file.table.push(data);
      this.write(table, file);
    } catch (e) {
      this.error(e, 'set');
    }
  }

  findOne(table, condition) {
    if (!this.findTable(table)) {
      this.error('no such table', 'findOne');
    } else {
      try {
        let file = this.readTable(table),
          index = null,
          obj = file.table.find((i, j) => {
            let res = compare(i);
            if (res) index = j;
            return res;
          });

        function compare(i) {
          let objType = typeof condition;
          switch (objType) {
            case 'function':
              return condition(i);
            case 'object':
              return Object.keys(condition).every(
                (el) => condition[el] == i[el]
              );
          }
        }
        return obj !== undefined || null ? { obj, index, table } : {};
      } catch (e) {
        this.error(e, 'findOne');
      }
    }
  }

  find(table, condition, quantity = Infinity) {
    if (!this.findTable(table)) {
      this.error('no such table', 'find');
    } else {
      try {
        let file = this.readTable(table),
          index = [],
          obj = [];

        for (
          let j = 0, i = file.table[j];
          j < file.table.length;
          j++, i = file.table[j]
        ) {
          if (index.length >= quantity) break;
          else if (compare(i)) {
            obj.push(i);
            index.push(j);
          }
        }

        function compare(i) {
          let objType = typeof condition;
          switch (objType) {
            case 'function':
              return condition(i);
            case 'object':
              return Object.keys(condition).every(
                (el) => condition[el] == i[el]
              );
          }
        }

        return obj.map((i, j) => {
          return { obj: i, index: index[j], table: table };
        });
      } catch (e) {
        this.error(e, 'find');
      }
    }
  }

  set(obj, data) {
    try {
      let filesStack = {};
      if (!Array.isArray(obj)) obj = [obj];
      obj = obj.flat();
      for (let i of obj) {
        let tableName = i.table;
        if (!filesStack[tableName]) {
          if (!this.findTable(tableName)) {
            this.error('no such table', 'set');
            continue;
          } else {
            filesStack[tableName] = this.readTable(tableName);
          }
        }
        let newData = Object.assign({}, data);
        if (newData.__id != i.obj.__id) newData.__id = i.obj.__id;
        if (newData.id != i.obj.id) newData.id = i.obj.id;
        filesStack[tableName].table[i.index] = newData;
        filesStack[tableName].__updatedAt = this.getDate();
      }
      Object.keys(filesStack).forEach((i) => this.write(i, filesStack[i]));
    } catch (e) {
      this.error(e, 'set');
    }
  }

  edit(obj, data) {
    try {
      if (!Array.isArray(obj)) obj = [obj];
      obj = obj.flat();
      let newObj = obj.map((i) => {
        Object.keys(data).map((o) => (i.obj[o] = data[o]));
        return i.obj;
      });
      for (let i in obj) {
        this.set(obj[i], newObj[i]);
      }
    } catch (e) {
      this.error(e, 'edit');
    }
  }

  delete(obj) {
    try {
      let filesStack = {};
      if (!Array.isArray(obj)) obj = [obj];
      obj = obj.flat();
      for (let i of obj) {
        let tableName = i.table;
        if (!filesStack[tableName]) {
          if (!this.findTable(tableName)) {
            this.error('no such table', 'delete');
            continue;
          } else {
            filesStack[tableName] = this.readTable(tableName);
          }
        }
        let file = filesStack[tableName];
        delete file.table[i.index];
        file.__updatedAt = this.getDate();
      }
      Object.keys(filesStack).forEach((i) => {
        filesStack[i].table = filesStack[i].table.filter(
          (i) => i !== null || undefined
        );
        this.write(i, filesStack[i]);
      });
    } catch (e) {
      this.error(e, 'delete');
    }
  }
};
