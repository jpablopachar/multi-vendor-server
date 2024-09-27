export class QueryProducts {
  products = []
  query = {}

  constructor(products, query) {
    this.products = products
    this.query = query
  }

  categoryQuery = () => {
    if (this.query.category)
      this.products = this.products.filter(
        (c) => c.category === this.query.category
      )

    return this
  }

  ratingQuery = () => {
    if (this.query.rating) {
      const rating = parseInt(this.query.rating)

      this.products = this.products.filter(
        (c) => rating <= c.rating && c.rating < rating + 1
      )
    }

    return this
  }

  searchQuery = () => {
    if (this.query.searchValue) {
      const searchValue = this.query.searchValue.toUpperCase()

      this.products = this.products.filter((p) =>
        p.name.toUpperCase().includes(searchValue)
      )
    }

    return this
  }

  priceQuery = () => {
    const { lowPrice = 0, highPrice = Infinity } = this.query

    this.products = this.products.filter(
      (p) => p.price >= lowPrice && p.price <= highPrice
    )

    return this
  }

  sortByPrice = () => {
    const { sortPrice } = this.query

    if (sortPrice) {
      this.products = this.products.sort((a, b) =>
        sortPrice === 'low-to-high' ? a.price - b.price : b.price - a.price
      )
    }

    return this
  }

  skip = () => {
    const { pageNumber = 1, parPage = this.products.length } = this.query
    const skipPage = (parseInt(pageNumber) - 1) * parPage

    this.products = this.products.slice(skipPage)

    return this
  }

  limit = () => {
    const { parPage = this.products.length } = this.query

    this.products = this.products.slice(0, parPage)

    return this
  }

  getProducts = () => {
    return this.products
  }

  countProducts = () => {
    return this.products.length
  }
}
