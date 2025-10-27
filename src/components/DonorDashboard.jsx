import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';


const DonorDashboard = ({ setCurrentUser }) => {

  const navigate = useNavigate();

  const [session, setSession] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: '',
    academicclass: '',
    edition: '',
    publisher: '',
    description: '',
    donatoremail: '',
    donor_id: ''
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setFormData({ ...formData, donor_id: session?.user?.id });


      const updateUser = async () => {
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
          console.error('Error upserting user:', error);
        } else {
          console.log('User upserted successfully:', data);
        }
      };

      updateUser();
      if (!session?.user) {
        navigate('/');
      }
    }
    );
    supabase.auth.updateUser({
      data: {
        role: "donor"
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
    console.log("signed out");
    navigate('/');
    console.log(error);
  };


  const [activeTab, setActiveTab] = useState('donate');

  //   title text not null, done
  // --   author text, done
  // --  subject text, done
  // --  academicclass text, done
  // --  Edition text, done 
  // --  publisher text, done
  // --   description text,  done
  // --   donor_id uuid, 



  const [coverImage, setCoverImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedBook, setAddedBook] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Sample data for books and requests
  const [myBooks, setMyBooks] = useState([
  ]);

  const fetchBooks = async () => {
    // console.log("fetching");

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('donor_id', session?.user?.id);
    if (error) {
      console.error('Error fetching books:', error);
    } else {
      // console.log('fd');

      setMyBooks(data);
    }
  };

  const [requests, setRequests] = useState([
    // {
    //   id: 1,
    //   bookTitle: "The Great Gatsby",
    //   receiverName: "Jane Doe",
    //   receiverEmail: "jane.doe@example.com",
    //   status: "pending"
    // },
    // {
    //   id: 2,
    //   bookTitle: "To Kill a Mockingbird",
    //   receiverName: "John Smith",
    //   receiverEmail: "john.smith@example.com",
    //   status: "pending"
    // }
  ]);

  const fetchRequestedBooks = async () => {
    // console.log("fetching");

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('donor_id', session?.user?.id);
    if (error) {
      console.error('Error fetching books:', error);
    } else {
      // console.log('fd');
      try {
        const pendingItems = data.filter(item => item.status === 'pending');
        const otherItems = data.filter(item => item.status !== 'pending');


        const sortedData = [...pendingItems, ...otherItems].map((item, index) => ({
          key: item.u_id,
          ...item
        }));
        setRequests(sortedData);
        // console.log("requests");

        // console.log(sortedData);
      } catch (error) {
        console.log(error);

      }
    }
  };



  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(e.target.files[0]);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // --  title text not null,
  // --   author text,
  // --  subject text,
  // --  academicclass text,
  // --  Edition text,
  // --  publisher text,
  // --   description text, 
  // --   donor_id uuid,
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Upload file using standard upload
    async function uploadFile(file) {
      console.log(file.lastModifiedDate);
      setLoading(true);
      const datas = await supabase.storage.from('book-covers').upload(`${Date.now()}-${file.name}`, file)
      if (datas.error) {
        // Handle error
        console.log("error");

        console.log(datas.error);
      } else {
        // Handle success
        console.log("file uploaded");

        console.log(import.meta.env.VITE_SUPABASE_URL+"/storage/v1/object/public/images/" + datas.data.path);

        const { data, error } = await supabase.from('books').insert(
          [{
            title: formData.title,
            author: formData.author,
            subject: formData.subject,
            academicclass: formData.academicclass,
            edition: formData.edition,
            publisher: formData.publisher,
            description: formData.description,
            donor_id: formData.donor_id,
            book_img_url: import.meta.env.VITE_SUPABASE_URL+"/storage/v1/object/public/book-covers/" + datas.data.path
          }]
        );
        console.log(data, error);


        setTimeout(() => {
          setLoading(false);
          const newBook = {
            title: formData.title,
            author: formData.author,
            subject: formData.subject,
          };
          setMyBooks([...myBooks, newBook]); // Add the new book to the list
          setAddedBook(newBook); // Set the book for the confirmation message
          setShowSuccessMessage(true);

          console.log(formData);

          // Hide the message after a few seconds
          setTimeout(() => setShowSuccessMessage(false), 5000);

          // Reset the form
          setFormData((prev) => ({
            title: '',
            author: '',
            subject: '',
            academicclass: '',
            edition: '',
            publisher: '',
            description: '',
            donatoremail: '',
            donor_id: prev.donor_id
          }));
          setCoverImage(null);
          setImagePreviewUrl(null);
        }, 1500);
      }
    }
    uploadFile(coverImage)

  };

  const handleRemoveBook = (id) => {
    setMyBooks(myBooks.filter(book => book.id !== id));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleAccept = async (request, id) => {
    // console.log(request);

    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: 'accepted',
        donor_email: session?.user?.user_metadata?.email
      })
      .eq('receiver_id', request.receiver_id)
      .eq('id', id);

    setRequests(requests.map((req, index) =>
      (req.receiver_id === request.receiver_id && req.id === id) ? { ...req, key: index, status: 'accepted' } : req
    ));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleDecline = async (receiver_id, id) => {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: 'declined',
        donor_email: session?.user?.user_metadata?.email
      })
      .eq('receiver_id', receiver_id)
      .eq('id', id);

    setRequests(requests.map((req, index) =>
      (req.receiver_id === receiver_id && req.id === id) ? { ...req, key: index, status: 'declined' } : req
    ));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);

    // setRequests(requests.filter(req => req.id !== id));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const academicclasses = Array.from({ length: 10 }, (_, i) => i + 1);
  const subjects = ['Science', 'Mathematics', 'History', 'Literature', 'Art', 'Other'];

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Donor Dashboard</h1>
        {/* <UserProfile user={user} handleSignOut={handleSignOut} role="Donor" /> */}
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
            className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${activeTab === 'donate'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('donate')}
          >
            Add a Book
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${activeTab === 'myBooks'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => { fetchBooks(); setActiveTab('myBooks') }}
          >
            My Books
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${activeTab === 'requests'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => {
              fetchRequestedBooks();
              setActiveTab('requests')
            }}
          >
            Book Requests
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'donate' ? (
            // Add Book Form Section
            <>
              {showSuccessMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
                  <strong className="font-bold">Success!</strong>
                  <span className="block sm:inline ml-2">You have added the book **"{addedBook?.title}"** to your list.</span>
                  <div className="mt-2 text-sm">
                    <p><strong>Author:</strong> {addedBook?.author}</p>
                    <p><strong>Subject:</strong> {addedBook?.subject}</p>
                  </div>
                  <button onClick={() => setShowSuccessMessage(false)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-green-700">
                    <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15L5.651 4.348a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.03a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15L14.348 14.849z" /></svg>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Add Book Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input type="text" name="author" value={formData.author} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject/Genre</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                      <option value="">Select a Subject</option>
                      {subjects.map((subject) => (<option key={subject} value={subject}>{subject}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Class</label>
                    <select name="academicclass" value={formData.academicclass} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select a Class</option>
                      {academicclasses.map((ac) => (<option key={ac} value={ac}>{ac}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
                    <input type="text" name="edition" value={formData.edition} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                    <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description</label>
                    <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donator's Contact Email</label>
                    <input type="email" name="donatoremail" value={formData.donatoremail} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Book Cover Image</label>
                    <div className="flex items-start space-x-4"> {/* Flex container for image+button group and other content (if any) */}
                      <div className="flex flex-col items-start space-y-2"> {/* New flex-col for image and its button */}
                        {imagePreviewUrl && (
                          <div>
                            <img src={imagePreviewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-md shadow-sm border border-gray-200" />
                          </div>
                        )}
                        <div className="w-full max-w-xs"> {/* Wrapper for the input to control width and align */}
                          <input
                            id="bookImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                        </div>
                      </div>
                      {/* You can add other form elements or content here if needed, they will be to the right of the image/button group */}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Book'}
                  </button>
                </div>
              </form>
            </>
          ) : activeTab === 'myBooks' ? (
            // My Books Section
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">My Books</h2>
              {myBooks.length > 0 ? (
                <div className="space-y-4">
                  {myBooks.map((book) => (
                    <div key={book.id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center bg-gray-50">
                      <div>
                        <p className="text-lg font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                        <p className="text-sm text-gray-600">at {book.created_at}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveBook(book.id)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">You have not added any books yet.</p>
              )}
            </div>
          ) : (
            // Book Request List Section
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Incoming Book Requests</h2>
              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.u_id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center bg-gray-50">
                      <div>
                        <p className="text-lg font-medium text-gray-900">{request?.book_name}</p>
                        <p className="text-sm text-gray-600">Requested by: <span className="font-semibold">{request.receiver_name}</span></p>
                        {request.status === 'accepted' && (
                          <p className="text-sm mt-1 text-green-600">Receiver Contact: {request.receiver_email}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {request.status === 'pending' ? (
                          <>
                            <button onClick={() => handleAccept(request, request.id)} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">
                              Accept
                            </button>
                            <button onClick={() => handleDecline(request.receiver_id, request.id)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700">
                              Decline
                            </button>
                          </>
                        ) : (
                          <span className={request.status === 'accepted' ? "text-sm font-medium text-green-600" : "text-sm font-medium text-red-600"}>{request.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No new book requests at this time.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;


