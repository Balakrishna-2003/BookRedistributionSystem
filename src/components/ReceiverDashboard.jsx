import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';



const academicClasses = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const subjects = ['Sci-Fi', 'Science', 'Fiction', 'Literature', 'Mathematics', 'Art', 'History', 'Other'];

const ReceiverDashboard = ({ setCurrentUser }) => {

  // Sample data for demonstration purposes
  const [sampleBooks, setSampleBooks] = useState([]);

  const navigate = useNavigate();


  const [activeTab, setActiveTab] = useState('shop');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [requestCart, setRequestCart] = useState([]);
  const [requestedBooks, setRequestedBooks] = useState([]);
  const [session, setSession] = useState(null);


  const fetchBooks = async () => {
    // console.log("fetching");

    const { data, error } = await supabase
      .from('books')
      .select('*');
    if (error) {
      console.error('Error fetching books:', error);
    } else {
      // console.log('fd');
      // console.log(data);

      setSampleBooks(data);
      // console.log(sampleBooks);

    }
  };


  useEffect(() => {



    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      // console.log(session);

      const updateUser = async () => {
        //   const datas = await supabase.auth.getUser();
        // if (datas?.data?.user) {
        //   setCurrentUser(datas.data.user);
        // }

        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              id: session?.user?.id,
              email: session?.user?.email,
              name: session?.user?.user_metadata?.name
            },
          ]);
        if (error) {
          console.error('Error inserting user:', error);
        } else {
          console.log('User upserted successfully:', data);
        }
      };



      updateUser();
      if (!session?.user) {
        navigate('/');
      }
      fetchBooks();
    });

    supabase.auth.updateUser({
      data: {
        role: "receiver"
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    // console.log("signed out");
    navigate('/');
    console.log(error);
  };

  // Filter books based on search term and filters



  const filteredBooks = useMemo(() => {
    return sampleBooks.filter(book => {
      const matchesSearchTerm =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.subject.toLowerCase().includes(searchTerm.toLowerCase());


      const matchesFilters =
        (filterSubject === '' || book.subject === filterSubject) &&
        (filterClass === '' || book.academicclass === filterClass);

      return matchesSearchTerm && matchesFilters;
    });
  }, [sampleBooks, searchTerm, filterSubject, filterClass]);


  const handleRequestBook = (book) => {  // This function is called when user clicks "Request Book" button to add to cart    

    if (!requestCart.find(item => item.id === book.id)) {
      setRequestCart([...requestCart, book]);
      console.log(book);
      // alert(`${book.title} has been added to your cart.`);
    } else {
      alert(`${book.title} is already in your cart.`);
    }
  };

  const handleRemoveFromCart = (bookId) => {
    setRequestCart(requestCart.filter(book => book.id !== bookId));
  };

  const handleSubmitRequest = async () => {
    console.log("Function called");
    if (requestCart.length === 0) {
      alert("Your cart is empty. Add some books to request.");
      return;
    }
    // console.log(requestCart.map(item => item));

    const newRequestedBooks = requestCart.map((book, index) => ({
      receiver_name: session?.user?.user_metadata?.name,
      receiver_email: session?.user?.email,
      id: book.id,
      book_name: book.title,
      receiver_id: session?.user?.id,
      donor_id: book.donor_id,
      author: book.author,
    }));

    console.log(newRequestedBooks);
    const { data, error } = await supabase
      .from('transactions')
      .insert(newRequestedBooks);

    if (error) {
      console.error('Error submitting request:', error);
      alert("There was an error submitting your request. Please try again.");
      return;
    } else {
      console.log('Request submitted successfully:', data);
    }
    setRequestedBooks([...requestedBooks, ...newRequestedBooks]);
    setRequestCart([]);
    setActiveTab('requested');
    fetchRequestedBooks()
    alert(`Your request for ${newRequestedBooks.length} book(s) has been submitted!`);
  };

  const fetchRequestedBooks = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('receiver_id', session?.user?.id);
    if (error) {
      console.error('Error fetching requested books:', error);
    } else {
      // console.log('Fetched requested books:', data);

      setRequestedBooks(data);
    }
  };

  const simulateAcceptance = (bookId) => {
    const updatedRequested = requestedBooks.map((book, index) => {
      if (book.id === bookId && book.status === 'pending') {
        return {
          ...book,
          status: 'accepted',
          donorContact: 'donor.contact@example.com',
        };
      }
      return book;
    });
    setRequestedBooks(updatedRequested);
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Receiver Dashboard</h1>
        <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-inner mb-6">
          <div className="flex-shrink-0"> { /* if no profile pic, show default icon svg*/}
            {
              (!session?.user?.user_metadata?.picture) ?
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 text-black-600 rounded-full bg-indigo-100 pg-2">
                  <path d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                :
                <img src={session?.user?.user_metadata?.picture} alt='profile' className="w-8 h-8 text-indigo-600 rounded-full bg-indigo-100" />
            }
          </div>
          <div className="flex-grow">
            <p className="text-lg font-semibold text-gray-900">{session?.user?.user_metadata?.name} </p>
            <p className="text-sm text-gray-500">{session?.user?.user_metadata?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full shadow-sm hover:bg-red-700 transition-colors duration-300"
          >
            Logout
          </button>
        </div>
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { fetchBooks(); setActiveTab('shop') }}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${activeTab === 'shop' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Book Shop
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-300 relative ${activeTab === 'cart' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Request Cart ({requestCart.length})
            {requestCart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {requestCart.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { fetchRequestedBooks(); setActiveTab('requested') }}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${activeTab === 'requested' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Requested Books
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'shop' && (
            // Book Shop View
            <div>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by title, author, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                >
                  {showFilters ? 'Hide Filters' : 'Filter Books'}
                </button>
              </div>

              {showFilters && (
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Class</label>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Classes</option>
                      {academicClasses.map(ac => <option key={ac} value={ac}>{ac}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredBooks.length > 0 ? (
                  filteredBooks.map(book => (
                    <div key={book.id} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden flex flex-col items-center p-4 transform hover:scale-105 transition-transform duration-300">
                      {/* Book Cover */}
                      <img src={book.book_img_url} alt={book.title} className="w-3/4 h-45 max-h-56 object-contain rounded-md mb-4 shadow-sm" />

                      {/* Book Details */}
                      <div className="text-center w-full flex-grow space-y-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{book.title}</h3>
                        <p className="text-sm font-medium text-gray-700">by <span className="text-gray-900">{book.author}</span></p>
                        <p className="text-xs text-gray-500 line-clamp-1">{book.subject} | Class: {book.academicclass}</p>
                      </div>

                      {/* Request Button */}
                      <div className="mt-4 w-full">
                        <button
                          onClick={() => handleRequestBook(book)}
                          disabled={requestCart.find(item => item.id === book.id)}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          {(!requestCart.find(item => item.id === book.id) ? "Request Book" : "Requested ✓")}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center col-span-full">No books found matching your criteria.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cart' && (
            // Request Cart View
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Request Cart</h2>
              {requestCart.length > 0 ? (
                <>
                  <ul className="space-y-2">
                    {requestCart.map(book => (
                      <li key={book.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                        <span className="font-medium text-gray-700">{book.title}</span>
                        <button
                          onClick={() => handleRemoveFromCart(book.id)}
                          className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-right">
                    <button
                      onClick={() => { handleSubmitRequest() }}
                      className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 transition-colors"
                    >
                      Submit Request
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Your request cart is empty.</p>
              )}
            </div>
          )}

          {activeTab === 'requested' && (
            // Requested Books View
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Requested Books</h2>
              {requestedBooks.length > 0 ? (
                <div className="space-y-4">
                  {requestedBooks.map(book => (
                    <div key={book.id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center bg-gray-50">
                      <div>
                        <p className="text-lg font-medium text-gray-900">{book.book_name}</p>
                        <p className="text-sm text-gray-600">Author: {book.author}</p>
                        <p className="text-sm mt-1">Status:
                          <span className={`font-semibold ml-1 ${book.status === 'pending' ? 'text-yellow-600' : book.status === 'declined' ? 'text-red-600' : 'text-green-600'}`}>
                            {book.status}
                          </span>
                        </p>
                        {book.status === 'accepted' && (
                          <div className="mt-2 text-sm text-gray-700">
                            <p>Contact Donor: <span className="font-semibold text-indigo-600">{book.donor_email}</span></p>
                            <p className="mt-1 text-xs text-gray-500 italic">
                              Contact the donor to arrange for pickup or delivery.
                            </p>
                          </div>
                        )}
                      </div>
                      {book.status === 'pending' && (
                        <button
                          onClick={() => simulateAcceptance(book.id)}
                          className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
                        >
                          Simulate Accept
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">You have not requested any books yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiverDashboard;