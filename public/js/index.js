var $
var location
var ajaxBooks = []
$(document).ready(function () {
  $('.ui.accordion').accordion()
  $('.ui.checkbox').checkbox()

  $('.closeModal').click(function () {
    $('.modal').modal('hide')
  })

  $('#addNewBook').click(function () {
    $('.addBookModal').modal('show')
    $('#addNewBookGrid').html('')
    $('#bookNameInput').val('')
  })

  $('#addNewBookForm').submit(function (event) {
    event.preventDefault()
    $('#addNewBookSegment').addClass('loading')
    if ($('#bookNameInput').val() !== '') {
      getBooks($('#bookNameInput').val())
    }
  })

  $('.bookCard').on('click',
    function () {
      $('.ui.large.modal').modal('show')
      $('#bookInfoSegment').addClass('loading')
      $('.requestTrade').text('Request Trade')
      $('.bookNameSpan').text($(this).children('h5').text())
      $('.ui.large.modal').attr('id', $(this).attr('id'))
      getBookInfo($(this).attr('id'))
    })

  $('.cancelRequest').on('click',
    function () {
      cancelRequest($(this).parents('.item').attr('id'))
      $(this).parents('.item').remove()
    })

  $('.acceptRequest').on('click',
    function () {
      acceptRequest($(this).parents('.item').attr('id'))
    })

  $('.completeRequest').on('click',
    function () {
      completeRequest($(this).parents('.item').attr('id'))
      $(this).parents('.item').remove()
    })

  $('.counterRequest').on('click',
    function () {
      $('.chooseBookModal').modal('show')
      $('#chooseBookGrid').html('')
      $('#chooseBookSegment').addClass('loading')
      var rId = $(this).parents('.item').attr('id')
      $
        .ajax({
          url: '/requests/choose',
          type: 'GET',
          data: {
            username: $(this).parents('.item').children('.senderUsername').val()
          },
          error: function (xhr, status, error) {
            console.log(error)
          },
          success: function (result, status, xhr) {
            counterRequestGet(result.books, rId)
          }
        })
    })

  $('.requestTrade').on('click',
    function () {
      $(this).addClass('loading')
      requestTrade($(this).parents('.modal').attr('id'), this)
    })
  $('.deleteBook').on('click',
    function () {
      if (window.confirm('Are You Sure ?????!!!!')) {
        $(this).addClass('loading')
        deleteBook($(this).parents('.modal').attr('id'), this)
      }
    })
})

var getBooks = function (bookName) {
  $
    .ajax({
      url: '/addbooks?bookname=' + bookName + '',
      type: 'GET',
      error: function (xhr, status, error) {
        console.log(error)
        $('.modal').modal('hide')
        $('#addNewBookSegment').removeClass('loading')
      },
      success: function (result, status, xhr) {
        if (typeof result !== 'object') {
          $('#addNewBookSegment').removeClass('loading')
          var html = `<h1>You need to logged in to do that.</h1>`
          $('#addNewBookGrid').html(html)
        } else {
          ajaxBooks = result.volumes
          showBooks(result.volumes)
          $('#addNewBookSegment').removeClass('loading')
        }
      }
    })
}

var showBooks = function (volumes) {
  var html = ``
  for (var volume of volumes) {
    html += `<div class="sixteen wide mobile eight wide tablet four wide computer column">
                    <div class="card choiceCard">
                    <input style="display:none" id="bookNumber" type="text" value="${volumes.indexOf(volume)}">
                      <div class="image">
                        <img class="thumbnail" src="${volume.thumbnail}"
                        alt="">
                      </div>
                      <a href="#">
                        <h5>${volume.title}</h5>
                      </a>
                    </div>
                  </div>`
  }
  $('#addNewBookGrid').html(html)
  $('.choiceCard').on('click', function () {
    $('.modal').modal('hide')
    var i = $(this).children('#bookNumber').val()
    var html = ``
    html += `<div class="sixteen wide mobile eight wide tablet four wide computer column">
                    <div id="" class="card newCard">
                      <div class="image">
                        <img class="thumbnail" src="${ajaxBooks[i].thumbnail}"
                        alt="">
                      </div>
                        <h5>${ajaxBooks[i].title}</h5>
                    </div>
                  </div>`
    console.log(ajaxBooks[i])
    $('.booksGrid').prepend(html)
    $('.newCard').on('click',
      function () {
        location.reload()
      })
    sendBook(i)
  })
}

var sendBook = function (index) {
  $
    .ajax({
      url: '/books',
      type: 'POST',
      data: ajaxBooks[index],
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {}
    })
}

var getBookInfo = function (id) {
  $
    .ajax({
      url: '/bookinfo',
      type: 'GET',
      data: {
        id: id
      },
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {
        $('#bookInfoSegment').html(result)
        $('#bookInfoSegment').removeClass('loading')
      }
    })
}

var cancelRequest = function (id) {
  $
    .ajax({
      url: '/requests',
      type: 'DELETE',
      data: {
        id: id
      },
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {}
    })
}

var acceptRequest = function (id) {
  $
    .ajax({
      url: '/requests',
      type: 'PUT',
      data: {
        id: id,
        op: 'accept'
      },
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {
        location.reload()
      }
    })
}

var completeRequest = function (id) {
  $
    .ajax({
      url: '/requests',
      type: 'PUT',
      data: {
        id: id,
        op: 'complete'
      },
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {}
    })
}

var counterRequestGet = function (volumes, requestId) {
  var html = ``
  for (var volume of volumes) {
    html += `<div class="sixteen wide mobile eight wide tablet four wide computer column">
                    <div class="card counterCard">
                    <input style="display:none" id="bookNumber" type="text" value="${volume._id}">
                      <div class="image">
                        <img class="thumbnail" src="${volume.thumbnail}"
                        alt="">
                      </div>
                      <a href="#">
                        <h5>${volume.title}</h5>
                      </a>
                    </div>
                  </div>`
  }
  console.log(requestId)
  $('#chooseBookGrid').html(html)
  $('#chooseBookSegment').removeClass('loading')
  $('.counterCard').on('click', function () {
    $('.chooseBookModal').modal('hide')
    var id = $(this).children('#bookNumber').val()
    counterBook(id, requestId)
  })
}

var counterBook = function (bookId, requestId) {
  $
    .ajax({
      url: '/requests/choose',
      type: 'POST',
      data: {
        bookId: bookId,
        requestId: requestId
      },
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {
        location.reload()
      }
    })
}

var requestTrade = function (id, button) {
  $
    .ajax({
      url: '/requests',
      type: 'POST',
      data: {
        id: id
      },
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {
        if (result.length > 50) {
          $(button).removeClass('loading')
          $(button).text('Please Login')
        } else {
          $(button).removeClass('loading')
          $(button).text(result)
        }
      }
    })
}

var deleteBook = function (id) {
  $
    .ajax({
      url: '/books',
      type: 'DELETE',
      data: {
        id: id
      },
      error: function (xhr, status, error) {
        console.log(error)
      },
      success: function (result, status, xhr) {
        $('.ui.large.modal').modal('hide')
        $('.deleteBook').removeClass('loading')
        $('#' + id + '.card').closest('.column').remove()
      }
    })
}
