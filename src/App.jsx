import {  useEffect, useState } from 'react';
import LoginPage from './components/LoginPage';
import DonorDashboard from './components/DonorDashboard';
import ReceiverDashboard from './components/ReceiverDashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './components/supabase';

const ShopPage = () => {

  const [currentUser, setCurrentUser] = useState(null);
  const [isaDonor, setIsaDonor] = useState(true);
  const [iDonor, setIDonor] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
        // console.log(data.user?.user_metadata.role);
        if(data.user?.user_metadata.role === 'donor'){
          setIDonor(<DonorDashboard setCurrentUser={setCurrentUser}/>);
        }else{
          setIDonor(<ReceiverDashboard setCurrentUser={setCurrentUser}/>);
        }
      }
    };

    checkUser();
  }, []);


  const [books, setBooks] = useState(null);
  
  
  
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!currentUser?<LoginPage  isaDonor={isaDonor} setIsaDonor={setIsaDonor} setBooks={setBooks} /> : iDonor } />
          <Route path="/login" element={<LoginPage isaDonor={isaDonor} setIsaDonor={setIsaDonor} setBooks={setBooks} />} />
          <Route path="/receiverDashboard" element={ <ReceiverDashboard setCurrentUser={setCurrentUser}/>}/>
          <Route path="/DonorDashboard" element={ <DonorDashboard setCurrentUser={setCurrentUser}/>} />
          {/* You can add more routes here, e.g., <Route path="/contact" element={<ContactPage />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default ShopPage;