/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import BillsUI from '../views/BillsUI.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store'
import { bills } from '../fixtures/bills.js'
import router from '../app/Router.js'
import store from '../__mocks__/store'

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then mail icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee'
        })
      )
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      const iconHighlighted = windowIcon.classList.contains('active-icon')
      expect(iconHighlighted).toBeTruthy()
    })

    test('Then input should return an error if user try to put other file format as a Justificative', () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const store = null
      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage
      })

      const mockHandleChangeFile = jest.fn(newBill.handleChangeFile)

      const inputFileJustificative = screen.getByTestId('file')
      expect(inputFileJustificative).toBeTruthy()

      inputFileJustificative.addEventListener('change', mockHandleChangeFile)
      fireEvent.change(inputFileJustificative, {
        target: {
          files: [new File(['file.pdf'], 'file.pdf', { type: 'file/pdf' })]
        }
      })
      expect(mockHandleChangeFile).toHaveBeenCalled()
      expect(inputFileJustificative.files[0].name).not.toBe('file.jpg')
    })

    test('Then should uploand an image as a justificative', () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const store = null
      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage
      })

      const mockHandleChangeFile = jest.fn(newBill.handleChangeFile)

      const inputFileJustificative = screen.getByTestId('file')
      expect(inputFileJustificative).toBeTruthy()

      inputFileJustificative.addEventListener('change', mockHandleChangeFile)
      fireEvent.change(inputFileJustificative, {
        target: {
          files: [new File(['file.jpg'], 'file.jpg', { type: 'file/jpg' })]
        }
      })
      expect(mockHandleChangeFile).toHaveBeenCalled()
      expect(inputFileJustificative.files[0].name).toBe('file.jpg')
    })

    test('Then fields of newBills page should be loaded successfully', () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
      expect(screen.getByTestId('expense-type')).toBeTruthy()
      expect(screen.getByTestId('expense-name')).toBeTruthy()
      expect(screen.getByTestId('datepicker')).toBeTruthy()
      expect(screen.getByTestId('amount')).toBeTruthy()
      expect(screen.getByTestId('vat')).toBeTruthy()
      expect(screen.getByTestId('pct')).toBeTruthy()
      expect(screen.getByTestId('commentary')).toBeTruthy()
      expect(screen.getByTestId('file')).toBeTruthy()
      expect(screen.getByRole('button')).toBeTruthy()
    })
  })
})

// Test d'intégration POST
describe('Given I am connected as an employee', () => {
  describe('When I create a new bill', () => {
    test('Then the bill is successfully submited', async () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      Object.defineProperty(window, 'localeStorage', {
        value: localStorageMock
      })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a'
        })
      )
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage
      })

      const testValidBill = {
        type: 'Hôtel et logement',
        name: 'hôtel de test',
        date: '2022-04-19',
        amount: 150,
        vat: 20,
        pct: 20,
        commentary: 'test',
        fileUrl: '../img/test.jpg',
        fileName: 'test.jpg',
        status: 'pending'
      }

      // charge les valeurs dans les champs
      screen.getByTestId('expense-type').value = testValidBill.type
      screen.getByTestId('expense-name').value = testValidBill.name
      screen.getByTestId('datepicker').value = testValidBill.date
      screen.getByTestId('amount').value = testValidBill.amount
      screen.getByTestId('vat').value = testValidBill.vat
      screen.getByTestId('pct').value = testValidBill.pct
      screen.getByTestId('commentary').value = testValidBill.commentary
      newBill.fileUrl = testValidBill.fileUrl
      newBill.fileName = testValidBill.fileName

      newBill.updateBill = jest.fn()
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      const form = screen.getByTestId('form-new-bill')
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
    })

    test('Then fetch error 500 from API', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => {})

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })
      Object.defineProperty(window, 'location', {
        value: { hash: ROUTES_PATH.NewBill }
      })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = '<div id="root"></div>'
      router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills = jest.fn().mockImplementation(() => {
        return {
          update: () => {
            return Promise.reject(new Error('Erreur 500'))
          },
          list: () => {
            return Promise.reject(new Error('Erreur 500'))
          }
        }
      })
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      // Soumission du formulaire
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toBeCalled()
    })
  })
})
