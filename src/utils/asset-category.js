const ID_ENCODE_LENGTH = [2, 2, 2, 4, 4]

class AssetCategoryManager {
  constructor() {
    this.categoryMap = new Map()
    this.rootCategories = []
  }

  isValidId(id) {
    return this.categoryMap.has(id)
  }

  parse(fileContent) {
    var lines = fileContent.split('\n')
    for (var i = 0; i < lines.length; ++i) {
      var line = lines[i]
      var columns = line.split(',')
      if (!line || columns.length < 2) continue
      var id = columns[0]
      var idObj = this.parseId(id)
      var attrs = columns.slice(1)
      if (idObj.level === 1) {
        this.rootCategories.push({
          id: id,
          attrs: attrs,
          hasChildren: true
        })
      } else {
        if (!this.categoryMap.has(idObj.parentId)) {
          this.categoryMap.set(idObj.parentId, {
            children: new Set()
          })
        }
        var parentItem = this.categoryMap.get(idObj.parentId)
        parentItem.children.add(id)
      }
      if (!this.categoryMap.has(id)) {
        this.categoryMap.set(id, {
          attrs: attrs,
          parentId: idObj.parentId,
          children: new Set()
        })
      } else {
        var item = this.categoryMap.get(id)
        item.attrs = attrs
        item.parentId = idObj.parentId
      }
    }
  }

  parseId(id) {
    var begin = 0
    var level = 0
    var parentId = ''
    for (var i = 0; i < ID_ENCODE_LENGTH.length; ++i) {
      var len = ID_ENCODE_LENGTH[i]
      var sectionId = id.substr(begin, len)
      if (!sectionId) break
      if (begin + len < id.length) {
        parentId += sectionId
      }
      level++
      begin += len
    }
    return {
      level: level,
      parentId: parentId,
    }
  }

  getChildren(id) {
    if (!id) {
      return this.rootCategories
    }
    if (!this.categoryMap.has(id)) {
      return null
    }
    var children = this.categoryMap.get(id).children
    var results = []
    children.forEach(function (i) {
      var value = this.categoryMap.get(i)
      results.push({
        id: i,
        attrs: value.attrs,
        hasChildren: value.children && value.children.size > 0
      })
    }.bind(this))
    return results
  }
}

module.exports = AssetCategoryManager